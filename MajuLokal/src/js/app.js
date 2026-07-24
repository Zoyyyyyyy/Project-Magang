// ─────────────────────────────────────────────────────────────────────────────
// app.js  —  Central event controller for MajuLokal SPA
// Imports all modules, manages global state, and wires DOM events.
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG }                                              from './config.js';
import { fetchUsers, fetchUserById, saveUserBusiness,
         saveDailyPromo, fetchPromoUserIds, verifyAdminLogin } from './supabase.js';
import { getGeminiKey, generateBusinessOptions,
         generateDailyPromos }                                from './ai.js';
import {
  escHtml, showToast,
  switchView, toggleMobileMenu,
  renderChoiceCards, setInkubasiLoading, showInkubasiResults, setCardSaving,
  populateUserDropdown, renderProfileBadge, renderRoadmapWidget,
  renderPromoTabs, switchPromosiTab, setPromosiLoading,
  renderAdminKeyStatus, renderAdminTable, setAdminTableLoading,
  showApiKeyNotice,
  showAdminLoginError, setAdminLoginLoading, showAdminDashboard
} from './ui.js';

// ── Global State ──────────────────────────────────────────────────────────────
/** @type {Array} Enriched choice objects from the last Gemini business generation. */
let currentChoices   = [];

/** @type {object|null} Full DB row of the currently selected user in Menu 2. */
let selectedUserData = null;

/** @type {'wa'|'ig'|'fb'|'tiktok'} Active tab in the promo output panel. */
let activePromosiTab = 'wa';

/** @type {boolean} Global login state for Admin View. */
let isAdminLoggedIn = false;

// ── Inkubasi (Menu 1) Handlers ────────────────────────────────────────────────

async function handleGenerateIde() {
  const nama    = document.getElementById('inkubasi-nama')?.value.trim()    ?? '';
  const kondisi = document.getElementById('inkubasi-kondisi')?.value.trim() ?? '';
  const modal   = document.getElementById('inkubasi-modal')?.value.trim()   ?? '';

  if (!nama)    { showToast('Nama tidak boleh kosong.', 'warn');                          return; }
  if (!kondisi) { showToast('Ceritakan kondisimu terlebih dahulu.', 'warn');              return; }
  if (!modal)   { showToast('Masukkan perkiraan modal awal.', 'warn');                    return; }
  if (!getGeminiKey()) {
    showToast('API Key Gemini belum diatur. Masuk ke menu Admin.', 'error');
    return;
  }

  setInkubasiLoading(true);
  console.info('[App] handleGenerateIde — nama:', nama, 'modal:', modal);

  try {
    const rawChoices = await generateBusinessOptions({ nama, kondisi, modal: Number(modal) });

    // Enrich each choice with form context so pilihIde can save it
    currentChoices = rawChoices.map(c => ({
      ...c,
      _nama_user: nama,
      _kondisi:   kondisi,
      _modal:     Number(modal),
    }));

    renderChoiceCards(currentChoices);
    showInkubasiResults(true);
    showToast('3 ide bisnis berhasil dibuat!', 'success');
    console.info('[App] handleGenerateIde — rendered', currentChoices.length, 'choices.');
  } catch (err) {
    showToast(err.message, 'error');
    console.error('[App] handleGenerateIde error:', err);
  } finally {
    setInkubasiLoading(false);
  }
}

async function handlePilihIde(idx) {
  const choice = currentChoices[idx];
  if (!choice) {
    console.warn('[App] handlePilihIde — no choice at index', idx);
    return;
  }

  setCardSaving(idx, true);
  console.info('[App] handlePilihIde — index:', idx, 'bisnis:', choice.nama_bisnis);

  try {
    const payload = {
      nama_user:           choice._nama_user,
      kondisi_lingkungan:  choice._kondisi,
      modal_awal:          choice._modal,
      ide_bisnis_terpilih: choice.nama_bisnis,
      roadmap_4_minggu:    choice.roadmap_4_minggu,
    };

    await saveUserBusiness(payload);
    showToast(`"${choice.nama_bisnis}" berhasil disimpan! Memindahkan ke Promosi Harian...`, 'success');
    console.info('[App] handlePilihIde — saved successfully, redirecting to promosi.');

    setTimeout(() => {
      switchView('promosi');
      handleLoadUserProfiles();
    }, 1200);
  } catch (err) {
    showToast('Gagal menyimpan: ' + err.message, 'error');
    console.error('[App] handlePilihIde error:', err);
    setCardSaving(idx, false);
  }
}

// ── Promosi Harian (Menu 2) Handlers ─────────────────────────────────────────

async function handleLoadUserProfiles() {
  const select = document.getElementById('promosi-user-select');
  if (!select) return;

  select.innerHTML = '<option value="">-- Memuat daftar profil... --</option>';
  console.info('[App] handleLoadUserProfiles — fetching users.');

  try {
    const users = await fetchUsers('select=id,nama_user,ide_bisnis_terpilih&order=created_at.desc');
    populateUserDropdown(users);
    console.info('[App] handleLoadUserProfiles —', users.length, 'user(s) loaded.');
  } catch (err) {
    select.innerHTML = '<option value="">-- Gagal memuat profil --</option>';
    showToast('Gagal memuat profil: ' + err.message, 'error');
    console.error('[App] handleLoadUserProfiles error:', err);
  }
}

async function handleUserSelected() {
  const userId = document.getElementById('promosi-user-select')?.value;
  if (!userId) {
    selectedUserData = null;
    renderProfileBadge(null);
    renderRoadmapWidget(null);
    console.info('[App] handleUserSelected — selection cleared.');
    return;
  }

  console.info('[App] handleUserSelected — userId:', userId);

  try {
    selectedUserData = await fetchUserById(userId);
    renderProfileBadge(selectedUserData);
    renderRoadmapWidget(selectedUserData.roadmap_4_minggu);
    console.info('[App] handleUserSelected — loaded:', selectedUserData.nama_user);
  } catch (err) {
    showToast('Gagal memuat profil: ' + err.message, 'error');
    console.error('[App] handleUserSelected error:', err);
  }
}

async function handleGeneratePromosi() {
  if (!selectedUserData) {
    showToast('Pilih profil pengguna terlebih dahulu.', 'warn');
    return;
  }

  const perintah = document.getElementById('promosi-perintah')?.value.trim() ?? '';
  const tipeKonten = document.getElementById('promosi-tipe-select')?.value ?? 'Perkenalan / Biar Terkenal (TOFU)';
  if (!perintah) {
    showToast('Ketik perintah promosi harian terlebih dahulu.', 'warn');
    return;
  }

  if (!getGeminiKey()) {
    showToast('API Key Gemini belum diatur. Masuk ke menu Admin.', 'error');
    return;
  }

  setPromosiLoading(true);
  console.info('[App] handleGeneratePromosi — user:', selectedUserData.nama_user, 'perintah:', perintah, 'tipe:', tipeKonten);

  try {
    const promoData = await generateDailyPromos(selectedUserData, perintah, tipeKonten);

    // Render tabs
    renderPromoTabs(promoData);
    switchPromosiTab('wa');
    activePromosiTab = 'wa';
    document.getElementById('promosi-output')?.classList.remove('hidden');

    // Persist to database
    await saveDailyPromo({
      user_id:           selectedUserData.id,
      perintah_harian:   perintah,
      tipe_konten:       tipeKonten,
      promosi_whatsapp:  promoData.whatsapp,
      promosi_instagram: promoData.instagram,
      promosi_facebook:  promoData.facebook,
      promosi_tiktok:    promoData.tiktok,
    });

    showToast('Konten berhasil dibuat & disimpan ke database!', 'success');
    console.info('[App] handleGeneratePromosi — content saved to DB.');
  } catch (err) {
    showToast(err.message, 'error');
    console.error('[App] handleGeneratePromosi error:', err);
  } finally {
    setPromosiLoading(false);
  }
}

function handleSwitchPromosiTab(tab) {
  activePromosiTab = tab;
  switchPromosiTab(tab);
  console.debug('[App] handleSwitchPromosiTab —', tab);
}

function handleCopyTabContent() {
  const activeEl = document.getElementById('tab-content-' + activePromosiTab);
  if (!activeEl || !activeEl.textContent.trim()) {
    showToast('Tidak ada konten untuk disalin.', 'warn');
    return;
  }
  navigator.clipboard.writeText(activeEl.textContent.trim())
    .then(() => {
      showToast('Konten berhasil disalin ke clipboard!', 'success');
      console.debug('[App] handleCopyTabContent — copied tab:', activePromosiTab);
    })
    .catch(err => {
      showToast('Gagal menyalin. Salin manual.', 'error');
      console.error('[App] handleCopyTabContent error:', err);
    });
}

// ── Admin (Menu 3) Handlers ───────────────────────────────────────────────────

async function handleAdminLogin() {
  const userEl = document.getElementById('admin-username');
  const passEl = document.getElementById('admin-password');
  const username = userEl?.value.trim() ?? '';
  const password = passEl?.value ?? '';

  if (!username || !password) {
    showAdminLoginError(true);
    return;
  }

  showAdminLoginError(false);
  setAdminLoginLoading(true);

  try {
    const isValid = await verifyAdminLogin(username, password);
    if (isValid) {
      isAdminLoggedIn = true;
      if (userEl) userEl.value = '';
      if (passEl) passEl.value = '';
      showAdminDashboard();
      handleLoadAdminKeyStatus();
      handleLoadAdminTable();
      showToast('Login berhasil!', 'success');
    } else {
      showAdminLoginError(true);
    }
  } catch (err) {
    showAdminLoginError(true);
    console.error('[App] handleAdminLogin error:', err);
  } finally {
    setAdminLoginLoading(false);
  }
}

function handleLoadAdminKeyStatus() {
  const key     = getGeminiKey();
  const inputEl = document.getElementById('admin-gemini-key');
  if (inputEl && key) inputEl.value = key;
  renderAdminKeyStatus(!!key);
  console.debug('[App] handleLoadAdminKeyStatus — key present:', !!key);
}

function handleSaveGeminiKey() {
  const key = document.getElementById('admin-gemini-key')?.value.trim() ?? '';
  if (!key) {
    showToast('API Key tidak boleh kosong.', 'warn');
    return;
  }
  localStorage.setItem(CONFIG.gemini.localStorageKey, key);
  showToast('API Key berhasil disimpan!', 'success');
  renderAdminKeyStatus(true);

  // Remove the "no key" notice from inkubasi view if present
  document.getElementById('api-key-notice')?.remove();
  console.info('[App] handleSaveGeminiKey — key saved.');
}

function handleClearGeminiKey() {
  if (!confirm('Yakin ingin menghapus Gemini API Key? Fitur AI akan berhenti berfungsi.')) return;
  localStorage.removeItem(CONFIG.gemini.localStorageKey);
  const inputEl = document.getElementById('admin-gemini-key');
  if (inputEl) inputEl.value = '';
  showToast('API Key berhasil dihapus.', 'info');
  renderAdminKeyStatus(false);
  console.info('[App] handleClearGeminiKey — key removed.');
}

function handleToggleKeyVisibility() {
  const input = document.getElementById('admin-gemini-key');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleLoadAdminTable() {
  setAdminTableLoading();
  console.info('[App] handleLoadAdminTable — fetching data.');

  try {
    const [users, promoRows] = await Promise.all([
      fetchUsers('select=*&order=created_at.desc'),
      fetchPromoUserIds(),
    ]);

    // Build promosi count map
    const promoCounts = {};
    promoRows.forEach(p => {
      promoCounts[p.user_id] = (promoCounts[p.user_id] ?? 0) + 1;
    });

    renderAdminTable(users, promoCounts);
    console.info('[App] handleLoadAdminTable — rendered', users.length, 'users.');
  } catch (err) {
    document.getElementById('admin-table-loading')?.classList.add('hidden');
    showToast('Gagal memuat data admin: ' + err.message, 'error');
    console.error('[App] handleLoadAdminTable error:', err);
  }
}

// ── Navigation with side-effects ──────────────────────────────────────────────

function navigateTo(viewName) {
  switchView(viewName, isAdminLoggedIn);

  if (viewName === 'promosi') {
    handleLoadUserProfiles();
  }
  if (viewName === 'admin') {
    if (isAdminLoggedIn) {
      handleLoadAdminKeyStatus();
      handleLoadAdminTable();
    }
  }
}

// ── Event Listener Wiring ─────────────────────────────────────────────────────

function attachEventListeners() {
  // ── Navbar ──
  document.getElementById('hamburger-btn')?.addEventListener('click', toggleMobileMenu);

  // Logo click
  document.querySelector('.flex.items-center.gap-2.cursor-pointer')
    ?.addEventListener('click', () => navigateTo('inkubasi'));

  // Mobile nav links (inside #mobile-menu)
  const mobileBtns = document.querySelectorAll('#mobile-menu button');
  mobileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleMobileMenu(); // close menu (already done by click before this fires)
    });
  });
  // Re-wire mobile nav buttons individually for navigation
  const [mobInkubasi, mobPromosi, mobAdmin] = mobileBtns;
  if (mobInkubasi) mobInkubasi.addEventListener('click', () => navigateTo('inkubasi'));
  if (mobPromosi)  mobPromosi.addEventListener('click',  () => navigateTo('promosi'));
  if (mobAdmin)    mobAdmin.addEventListener('click',    () => navigateTo('admin'));

  // ── Menu 1: Inkubasi ──
  document.getElementById('btn-generate-ide')?.addEventListener('click', handleGenerateIde);
  document.getElementById('btn-regenerate')?.addEventListener('click', handleGenerateIde);

  // Delegate clicks on dynamically-rendered "Pilih" buttons
  document.getElementById('cards-container')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-choice-idx]');
    if (btn) {
      const idx = parseInt(btn.getAttribute('data-choice-idx'), 10);
      handlePilihIde(idx);
    }
  });

  // ── Menu 2: Promosi Harian ──
  document.getElementById('promosi-user-select')?.addEventListener('change', handleUserSelected);
  document.querySelector('button[title="Refresh daftar profil"]')?.addEventListener('click', handleLoadUserProfiles);
  document.getElementById('btn-generate-promosi')?.addEventListener('click', handleGeneratePromosi);

  // Tab switching
  document.getElementById('tab-wa')?.addEventListener('click',     () => handleSwitchPromosiTab('wa'));
  document.getElementById('tab-ig')?.addEventListener('click',     () => handleSwitchPromosiTab('ig'));
  document.getElementById('tab-fb')?.addEventListener('click',     () => handleSwitchPromosiTab('fb'));
  document.getElementById('tab-tiktok')?.addEventListener('click', () => handleSwitchPromosiTab('tiktok'));

  // Copy button — uses closest selector since it's a sibling of the tabs
  document.querySelector('button[data-action="copy-tab"]')?.addEventListener('click', handleCopyTabContent);

  // ── Menu 3: Admin ──
  document.getElementById('btn-admin-login')?.addEventListener('click', handleAdminLogin);
  document.getElementById('admin-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAdminLogin();
  });
  document.getElementById('admin-username')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAdminLogin();
  });
  document.getElementById('btn-save-gemini-key')?.addEventListener('click', handleSaveGeminiKey);
  document.getElementById('btn-clear-gemini-key')?.addEventListener('click', handleClearGeminiKey);
  document.getElementById('btn-toggle-key-visibility')?.addEventListener('click', handleToggleKeyVisibility);
  document.getElementById('btn-refresh-admin-table')?.addEventListener('click', handleLoadAdminTable);

  // Allow pressing Enter in the Gemini key input to save
  document.getElementById('admin-gemini-key')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSaveGeminiKey();
  });

  // Notice "Masuk ke Admin" button (injected dynamically by ui.js)
  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'notice-go-admin') {
      navigateTo('admin');
    }
    // Also catch the copy button via event delegation on the output panel
    if (e.target && e.target.closest && e.target.closest('#btn-copy-tab')) {
      handleCopyTabContent();
    }
  });

  console.debug('[App] attachEventListeners — all listeners attached.');
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

function init() {
  console.info('[App] MajuLokal initialising...');

  attachEventListeners();

  // Show API key warning on inkubasi view if not configured
  if (!getGeminiKey()) {
    showApiKeyNotice();
  }

  // Make sure inkubasi is the default active view
  switchView('inkubasi', isAdminLoggedIn);

  console.info('[App] MajuLokal ready.');
}

// Run when the DOM is fully parsed
document.addEventListener('DOMContentLoaded', () => {
  // ── Cleanup: hide all loading overlays on startup ──
  ['inkubasi-loading', 'promosi-loading', 'admin-table-loading'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });

  // ── Navbar desktop links ──
  const navInkubasi = document.getElementById('nav-inkubasi');
  const navPromosi  = document.getElementById('nav-promosi');
  const navAdmin    = document.getElementById('nav-admin');

  if (navInkubasi) navInkubasi.addEventListener('click', () => navigateTo('inkubasi'));
  if (navPromosi)  navPromosi.addEventListener('click',  () => navigateTo('promosi'));
  if (navAdmin)    navAdmin.addEventListener('click',    () => navigateTo('admin'));

  init();
});
