// ─────────────────────────────────────────────────────────────────────────────
// ui.js  —  All DOM manipulation for MajuLokal (zero API calls here)
// ─────────────────────────────────────────────────────────────────────────────

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Escape HTML special characters to safely insert into innerHTML.
 * @param {*} str
 * @returns {string}
 */
export function escHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// ── Toast Notifications ───────────────────────────────────────────────────────

const TOAST_CONFIG = {
  success: { bg: 'bg-emerald-600', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>' },
  error:   { bg: 'bg-red-500',     icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' },
  info:    { bg: 'bg-brand-500',   icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' },
  warn:    { bg: 'bg-amber-500',   icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' },
};

/**
 * Display a transient toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warn'} type
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const cfg = TOAST_CONFIG[type] ?? TOAST_CONFIG.info;

  const toast = document.createElement('div');
  toast.className = `toast pointer-events-auto flex items-center gap-3 ${cfg.bg} text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg max-w-xs`;
  toast.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      ${cfg.icon}
    </svg>
    <span>${escHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3200);
}

// ── View / Navigation ─────────────────────────────────────────────────────────

/**
 * Show the named SPA view section and update nav link active states.
 * @param {'inkubasi'|'promosi'|'admin'} viewName
 * @param {boolean} [isAdminLoggedIn=false]
 */
export function switchView(viewName, isAdminLoggedIn = false) {
  const views = ['inkubasi', 'promosi', 'admin'];
  views.forEach(v => {
    const section = document.getElementById('view-' + v);
    if (section) {
      if (v === viewName) {
        section.classList.remove('hidden');
        section.classList.add('active');
        
        if (v === 'admin') {
          const loginCard = document.getElementById('admin-login-card');
          const dashboardPanel = document.getElementById('admin-dashboard-panel');
          if (loginCard && dashboardPanel) {
            if (isAdminLoggedIn) {
              loginCard.classList.add('hidden');
              dashboardPanel.classList.remove('hidden');
            } else {
              loginCard.classList.remove('hidden');
              dashboardPanel.classList.add('hidden');
              const errEl = document.getElementById('admin-login-error');
              if (errEl) errEl.classList.add('hidden');
            }
          }
        }
      } else {
        section.classList.add('hidden');
        section.classList.remove('active');
      }
    }
  });

  document.querySelectorAll('.nav-link').forEach(n => {
    n.classList.remove('active-nav');
    if (n.id === 'nav-' + viewName) {
      n.classList.add('active-nav');
      n.classList.remove('text-slate-600');
    } else {
      n.classList.add('text-slate-600');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Toggle the mobile hamburger menu open/closed.
 */
export function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;
  if (menu.classList.contains('open')) {
    menu.classList.remove('open');
    menu.classList.add('closed');
  } else {
    menu.classList.remove('closed');
    menu.classList.add('open');
  }
}

// ── Inkubasi View ─────────────────────────────────────────────────────────────

const CHOICE_COLORS = [
  { bg: 'bg-brand-500',   light: 'bg-brand-50',   badge: 'bg-brand-100 text-brand-700',     emoji: '🛒' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', emoji: '🌿' },
  { bg: 'bg-violet-500',  light: 'bg-violet-50',  badge: 'bg-violet-100 text-violet-700',   emoji: '✨' },
];

/**
 * Render 3 business choice cards into #cards-container.
 * Each card has a "Pilih & Ambil Ide Ini" button whose data-idx carries the
 * choice index — app.js listens via event delegation.
 * @param {Array} choices - Array of choice objects enriched with _nama_user / _kondisi / _modal.
 */
export function renderChoiceCards(choices) {
  const container = document.getElementById('cards-container');
  if (!container) return;
  container.innerHTML = '';

  choices.forEach((choice, idx) => {
    const col = CHOICE_COLORS[idx] ?? CHOICE_COLORS[0];

    // 4-week roadmap mini-preview
    const roadmapPreview = (choice.roadmap_4_minggu ?? []).map((w, wi) => `
      <div class="flex-1 min-w-0 text-center">
        <div class="w-7 h-7 rounded-full ${col.bg} text-white text-xs font-bold flex items-center justify-center mx-auto mb-1">
          ${w.minggu ?? wi + 1}
        </div>
        <p class="text-xs text-slate-500 font-medium leading-tight truncate">${escHtml(w.judul ?? '')}</p>
      </div>
    `).join('');

    // Week 1 task list preview
    const minggu1   = (choice.roadmap_4_minggu ?? [])[0];
    const tugasList = (Array.isArray(minggu1?.tugas) ? minggu1.tugas.slice(0, 3) : [])
      .map(t => `
        <li class="flex items-start gap-2 text-xs text-slate-600">
          <svg class="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
          ${escHtml(t)}
        </li>
      `).join('');

    const card = document.createElement('div');
    card.className = 'card-choice bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden';
    card.innerHTML = `
      <div class="${col.light} border-b border-slate-100 px-6 pt-5 pb-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <span class="inline-block px-2.5 py-0.5 ${col.badge} text-xs font-bold rounded-full mb-2">Opsi ${idx + 1}</span>
            <h3 class="text-lg font-extrabold text-slate-900 leading-tight mb-1">${escHtml(choice.nama_bisnis ?? '')}</h3>
            <p class="text-sm text-slate-500 italic">"${escHtml(choice.tagline ?? '')}"</p>
          </div>
          <div class="w-12 h-12 rounded-xl ${col.bg} flex items-center justify-center flex-shrink-0 shadow-md">
            <span class="text-2xl">${col.emoji}</span>
          </div>
        </div>

        <div class="flex gap-3 mt-3 flex-wrap">
          <div class="flex items-center gap-1.5 text-xs text-slate-600 bg-white/70 rounded-lg px-2.5 py-1.5">
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="font-semibold">${escHtml(choice.estimasi_pendapatan ?? '-')}</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-slate-600 bg-white/70 rounded-lg px-2.5 py-1.5">
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            <span class="font-semibold">Modal: ${escHtml(choice.modal_dibutuhkan ?? '-')}</span>
          </div>
        </div>
      </div>

      <div class="px-6 py-4">
        <p class="text-sm text-slate-600 leading-relaxed mb-4">${escHtml(choice.deskripsi ?? '')}</p>

        <div class="mb-4">
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preview Roadmap 4 Minggu</p>
          <div class="flex gap-2">${roadmapPreview}</div>
        </div>

        ${tugasList ? `
        <div class="mb-5">
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Langkah Awal (Minggu 1)</p>
          <ul class="space-y-1">${tugasList}</ul>
        </div>` : ''}

        <div class="flex gap-3 pt-2">
          <button
            id="btn-pilih-${idx}"
            data-choice-idx="${idx}"
            class="btn-pilih btn-primary flex-1 ${col.bg} hover:opacity-90 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Pilih &amp; Ambil Ide Ini
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * Set the "generate" button into a loading or default state.
 * @param {boolean} isLoading
 */
export function setInkubasiLoading(isLoading) {
  const btn      = document.getElementById('btn-generate-ide');
  const loadDiv  = document.getElementById('inkubasi-loading');
  const results  = document.getElementById('inkubasi-results');

  if (!btn || !loadDiv) return;

  if (isLoading) {
    btn.disabled  = true;
    btn.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2.5px;border-top-color:white;border-color:#fde8d5;"></div> Memproses...`;
    loadDiv.classList.remove('hidden');
    results.classList.add('hidden');
  } else {
    btn.disabled  = false;
    btn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.346A3.5 3.5 0 0118 19h-6a3.5 3.5 0 01-3.464-3.077l-.347-.346z"/>
      </svg>
      Hasilkan 3 Ide Bisnis dengan AI`;
    loadDiv.classList.add('hidden');
  }
}

/**
 * Show or hide inkubasi results section.
 * @param {boolean} visible
 */
export function showInkubasiResults(visible) {
  const el = document.getElementById('inkubasi-results');
  if (!el) return;
  if (visible) el.classList.remove('hidden');
  else         el.classList.add('hidden');
}

/**
 * Set a "Pilih" card button into saving or error-reset state.
 * @param {number} idx
 * @param {boolean} isSaving
 */
export function setCardSaving(idx, isSaving) {
  const btn = document.getElementById('btn-pilih-' + idx);
  if (!btn) return;
  if (isSaving) {
    btn.disabled  = true;
    btn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px;border-top-color:white;border-color:rgba(255,255,255,0.4);"></div> Menyimpan...`;
  } else {
    btn.disabled  = false;
    btn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
      Pilih &amp; Ambil Ide Ini`;
  }
}

// ── Promosi Harian View ───────────────────────────────────────────────────────

/**
 * Populate the user dropdown in Menu 2 with user records.
 * @param {Array} users - Array of { id, nama_user, ide_bisnis_terpilih }
 */
export function populateUserDropdown(users) {
  const select = document.getElementById('promosi-user-select');
  if (!select) return;

  select.innerHTML = '<option value="">-- Pilih nama profil --</option>';

  if (!users || users.length === 0) {
    select.innerHTML += '<option value="" disabled>Belum ada profil. Daftar via Inkubasi dahulu.</option>';
    return;
  }

  users.forEach(user => {
    const opt        = document.createElement('option');
    opt.value        = user.id;
    opt.textContent  = `${user.nama_user} — ${user.ide_bisnis_terpilih ?? 'Tanpa ide'}`;
    select.appendChild(opt);
  });
}

/**
 * Update the profile badge card in Menu 2.
 * @param {object|null} user - Full users_bisnis row, or null to hide.
 */
export function renderProfileBadge(user) {
  const badge  = document.getElementById('promosi-profile-info');
  const avatar = document.getElementById('promosi-profile-avatar');
  const nameEl = document.getElementById('promosi-profile-name');
  const ideEl  = document.getElementById('promosi-profile-ide');

  if (!badge) return;

  if (!user) {
    badge.classList.add('hidden');
    return;
  }

  avatar.textContent = (user.nama_user ?? '?')[0].toUpperCase();
  nameEl.textContent = user.nama_user ?? '-';
  ideEl.textContent  = user.ide_bisnis_terpilih
    ? `💼 ${user.ide_bisnis_terpilih}`
    : 'Belum ada ide terpilih';
  badge.classList.remove('hidden');
}

/**
 * Render the 4-week roadmap widget above the daily prompt form.
 * @param {Array|null} roadmapData - Array of { minggu, judul, tugas[] }
 */
export function renderRoadmapWidget(roadmapData) {
  const widget = document.getElementById('roadmap-widget');
  const grid   = document.getElementById('roadmap-grid');
  if (!widget || !grid) return;

  if (!Array.isArray(roadmapData) || roadmapData.length === 0) {
    widget.classList.add('hidden');
    return;
  }

  grid.innerHTML = '';

  roadmapData.forEach((week, idx) => {
    const tugasHtml = Array.isArray(week.tugas)
      ? week.tugas.map(t => `
          <li class="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
            <span class="text-brand-400 mt-0.5">•</span>
            <span>${escHtml(t)}</span>
          </li>`).join('')
      : '';

    const weekDiv = document.createElement('div');
    weekDiv.className = 'roadmap-week rounded-xl p-4';
    weekDiv.innerHTML = `
      <div class="flex items-center gap-2 mb-3">
        <div class="w-7 h-7 rounded-lg bg-brand-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          ${week.minggu ?? idx + 1}
        </div>
        <p class="text-xs font-bold text-slate-700 leading-tight">${escHtml(week.judul ?? `Minggu ${idx + 1}`)}</p>
      </div>
      ${tugasHtml
        ? `<ul class="space-y-0.5">${tugasHtml}</ul>`
        : '<p class="text-xs text-slate-400">Tidak ada tugas.</p>'}
    `;
    grid.appendChild(weekDiv);
  });

  widget.classList.remove('hidden');
}

/**
 * Render the 4-channel promo content into their respective tab panels.
 * @param {{ whatsapp: string, instagram: any, facebook: any, tiktok: any }} promoData
 */
export function renderPromoTabs(promoData) {
  const waEl = document.getElementById('tab-content-wa');
  if (waEl) {
    waEl.textContent = promoData.whatsapp ?? '';
  }

  const renderRichContent = (key, rawData) => {
    const el = document.getElementById('tab-content-' + key);
    if (!el) return;

    let data = rawData;
    if (typeof rawData === 'string') {
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        el.textContent = rawData;
        return;
      }
    }

    if (!data || typeof data !== 'object') {
      el.textContent = data ?? '';
      return;
    }

    const caption = data.caption || '';
    const ideKonten = data.ide_konten || '';
    const langkah = Array.isArray(data.langkah) ? data.langkah : [];

    const langkahHtml = langkah.map(step => `
      <li class="flex items-start gap-2 text-xs text-slate-700">
        <svg class="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        <span class="leading-relaxed">${escHtml(step)}</span>
      </li>
    `).join('');

    el.innerHTML = `
      <div class="flex flex-col md:flex-row gap-5 items-start">
        <div class="flex-1 w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📝 Teks Caption</h3>
          <div class="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium">${escHtml(caption)}</div>
        </div>
        <div class="flex-1 w-full bg-brand-50 border border-brand-100 rounded-xl p-4 shadow-sm">
          <h3 class="text-xs font-bold text-brand-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            💡 Ide Konten & Visual
          </h3>
          <p class="text-sm text-slate-700 mb-4 font-semibold italic">"${escHtml(ideKonten)}"</p>
          <h4 class="text-xs font-bold text-brand-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            📌 Langkah Pembuatan
          </h4>
          <ul class="space-y-2">
            ${langkahHtml}
          </ul>
        </div>
      </div>
    `;
  };

  renderRichContent('ig', promoData.instagram);
  renderRichContent('fb', promoData.facebook);
  renderRichContent('tiktok', promoData.tiktok);
}

/**
 * Switch the active promo channel tab.
 * @param {'wa'|'ig'|'fb'|'tiktok'} tab
 */
export function switchPromosiTab(tab) {
  ['wa', 'ig', 'fb', 'tiktok'].forEach(t => {
    const btn = document.getElementById('tab-' + t);
    if (!btn) return;
    if (t === tab) {
      btn.classList.add('active-tab');
      btn.classList.remove('bg-slate-100', 'text-slate-600');
    } else {
      btn.classList.remove('active-tab');
      btn.classList.add('bg-slate-100', 'text-slate-600');
    }
  });

  document.querySelectorAll('.promosi-tab-content').forEach(el => el.classList.add('hidden'));
  const activePanel = document.getElementById('tab-content-' + tab);
  if (activePanel) activePanel.classList.remove('hidden');
}

/**
 * Set the daily-promo generate button into loading or idle state.
 * @param {boolean} isLoading
 */
export function setPromosiLoading(isLoading) {
  const btn     = document.getElementById('btn-generate-promosi');
  const loadDiv = document.getElementById('promosi-loading');
  const output  = document.getElementById('promosi-output');
  if (!btn || !loadDiv) return;

  if (isLoading) {
    btn.disabled  = true;
    btn.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2.5px;border-top-color:white;border-color:#fde8d5;"></div> Memproses 4 Platform...`;
    loadDiv.classList.remove('hidden');
    output.classList.add('hidden');
  } else {
    btn.disabled  = false;
    btn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
      Buat Konten 4 Platform Sekaligus`;
    loadDiv.classList.add('hidden');
  }
}

// ── Admin View ────────────────────────────────────────────────────────────────

/**
 * Display or update the Gemini API key status indicator in Admin.
 * @param {boolean} hasKey
 */
export function renderAdminKeyStatus(hasKey) {
  const statusEl = document.getElementById('admin-key-status');
  if (!statusEl) return;

  statusEl.classList.remove('hidden');

  if (hasKey) {
    statusEl.innerHTML = `
      <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
      <span class="text-emerald-600">API Key aktif dan tersimpan.</span>`;
  } else {
    statusEl.innerHTML = `
      <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span class="text-amber-600">API Key belum diatur. Fitur AI tidak aktif.</span>`;
  }
}

/**
 * Render the admin users table and summary stats.
 * @param {Array} users       - Array of users_bisnis rows.
 * @param {object} promoCounts - Map of user_id => count.
 */
export function renderAdminTable(users, promoCounts) {
  const tableEl = document.getElementById('admin-table');
  const tbodyEl = document.getElementById('admin-table-body');
  const emptyEl = document.getElementById('admin-table-empty');
  const loadEl  = document.getElementById('admin-table-loading');
  const statsEl = document.getElementById('admin-stats');

  if (!tableEl || !tbodyEl) return;

  loadEl?.classList.add('hidden');

  if (!users || users.length === 0) {
    emptyEl?.classList.remove('hidden');
    tableEl.classList.add('hidden');
    statsEl?.classList.add('hidden');
    return;
  }

  // Stats
  const totalUsers   = users.length;
  const totalPromosi = Object.values(promoCounts).reduce((a, b) => a + b, 0);
  const avgModal     = users.reduce((sum, u) => sum + (Number(u.modal_awal) || 0), 0) / users.length;

  const statUsers   = document.getElementById('stat-total-users');
  const statPromosi = document.getElementById('stat-total-promosi');
  const statModal   = document.getElementById('stat-avg-modal');
  if (statUsers)   statUsers.textContent   = totalUsers;
  if (statPromosi) statPromosi.textContent = totalPromosi;
  if (statModal)   statModal.textContent   = 'Rp ' + Math.round(avgModal).toLocaleString('id-ID');

  // Rows
  tbodyEl.innerHTML = '';
  users.forEach(user => {
    const tanggal    = user.created_at
      ? new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-';
    const modal      = user.modal_awal ? 'Rp ' + Number(user.modal_awal).toLocaleString('id-ID') : '-';
    const promoCount = promoCounts[user.id] ?? 0;

    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="px-4 py-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 text-sm font-bold flex items-center justify-center flex-shrink-0">
            ${(user.nama_user ?? '?')[0].toUpperCase()}
          </div>
          <span class="font-semibold text-slate-800 text-sm">${escHtml(user.nama_user ?? '-')}</span>
        </div>
      </td>
      <td class="px-4 py-3 text-sm text-slate-600 font-medium">${escHtml(modal)}</td>
      <td class="px-4 py-3 text-xs text-slate-500 max-w-xs hidden sm:table-cell">
        <span class="line-clamp-2 block">
          ${escHtml((user.kondisi_lingkungan ?? '-').substring(0, 80))}${(user.kondisi_lingkungan ?? '').length > 80 ? '...' : ''}
        </span>
      </td>
      <td class="px-4 py-3">
        <span class="inline-block px-2.5 py-1 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full max-w-[140px] truncate">
          ${escHtml(user.ide_bisnis_terpilih ?? '-')}
        </span>
      </td>
      <td class="px-4 py-3 text-center">
        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full ${promoCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} text-xs font-bold">
          ${promoCount}
        </span>
      </td>
      <td class="px-4 py-3 text-xs text-slate-400">${tanggal}</td>
    `;
    tbodyEl.appendChild(tr);
  });

  emptyEl?.classList.add('hidden');
  tableEl.classList.remove('hidden');
  statsEl?.classList.remove('hidden');
}

/**
 * Set the admin table into a loading state.
 */
export function setAdminTableLoading() {
  document.getElementById('admin-table')?.classList.add('hidden');
  document.getElementById('admin-table-empty')?.classList.add('hidden');
  document.getElementById('admin-stats')?.classList.add('hidden');
  document.getElementById('admin-table-body').innerHTML = '';
  document.getElementById('admin-table-loading')?.classList.remove('hidden');
}

export function showAdminLoginError(show) {
  const errEl = document.getElementById('admin-login-error');
  if (errEl) {
    if (show) {
      errEl.classList.remove('hidden');
    } else {
      errEl.classList.add('hidden');
    }
  }
}

export function setAdminLoginLoading(isLoading) {
  const btn = document.getElementById('btn-admin-login');
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2.5px;border-top-color:white;border-color:rgba(255,255,255,0.3);"></div> Memproses...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = `Masuk`;
  }
}

export function showAdminDashboard() {
  const loginCard = document.getElementById('admin-login-card');
  const dashboardPanel = document.getElementById('admin-dashboard-panel');
  if (loginCard && dashboardPanel) {
    loginCard.classList.add('hidden');
    dashboardPanel.classList.remove('hidden');
  }
}

/**
 * Show an API-key-missing notice above the inkubasi form (run once on init).
 * Uses event delegation-friendly approach: the "Masuk ke Admin" button dispatches
 * a custom event that app.js can listen to for navigation.
 */
export function showApiKeyNotice() {
  const container = document.querySelector('#view-inkubasi .max-w-2xl');
  if (!container || container.querySelector('#api-key-notice')) return;

  const notice = document.createElement('div');
  notice.id        = 'api-key-notice';
  notice.className = 'bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 text-xs text-amber-700 font-medium';
  notice.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
    <span>
      Gemini API Key belum diatur.
      <button id="notice-go-admin" class="underline font-bold hover:text-amber-800">Masuk ke Admin</button>
      untuk mengkonfigurasinya terlebih dahulu.
    </span>`;
  container.insertBefore(notice, container.firstChild);
}
