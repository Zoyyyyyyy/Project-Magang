/* ============================================================
 * admin.js — Posyandu Demalang
 * Logika dashboard kader & autentikasi admin
 * Bergantung pada: supabase.js (_supabase, DUMMY_UUID)
 * dan ai.js (GEMINI_API_KEY, tampilkanToast)
 * ============================================================ */

/* ============================================================
 * KONSTANTA AUTENTIKASI
 * ============================================================ */
const KADER_AUTH_KEY = 'kader_auth';

/* ============================================================
 * UTILITAS GLOBAL
 * ============================================================ */

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Tampilkan toast singkat (ganti alert untuk feedback positif) */
function tampilkanToast(pesan, tipe = 'sukses') {
    const toast = document.getElementById('toast');
    toast.textContent = pesan;
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] px-5 py-4 rounded-xl shadow-lg text-base font-medium text-center';
    if (tipe === 'sukses') {
        toast.classList.add('bg-emerald-700', 'text-white');
    } else if (tipe === 'error') {
        toast.classList.add('bg-red-600', 'text-white');
    } else {
        toast.classList.add('bg-slate-800', 'text-white');
    }
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('hidden'), 4000);
}

/* ============================================================
 * UTILITAS TANGGAL & UMUR
 * ============================================================ */

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Hitung umur anak dalam bulan penuh */
function hitungUmurBulan(tanggalLahir) {
    const lahir = new Date(tanggalLahir + 'T00:00:00');
    const sekarang = new Date();
    let bulan = (sekarang.getFullYear() - lahir.getFullYear()) * 12;
    bulan += sekarang.getMonth() - lahir.getMonth();
    if (sekarang.getDate() < lahir.getDate()) bulan -= 1;
    return Math.max(0, bulan);
}

/** Format: "15 Jan 2025 (17 Bulan)" */
function formatTanggalUmur(tanggalLahir) {
    const d = new Date(tanggalLahir + 'T00:00:00');
    const teks = `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;
    const umur = hitungUmurBulan(tanggalLahir);
    return `${teks} (${umur} Bulan)`;
}

/* ============================================================
 * GEMINI KEY GUARD
 * ============================================================ */

function initGeminiKeyGuard() {
    const guard = document.getElementById('gemini-key-guard');
    if (!guard) return;

    const title = document.getElementById('gemini-guard-title');
    const desc = document.getElementById('gemini-guard-desc');
    const inputField = document.getElementById('web-gemini-key');

    if (GEMINI_API_KEY) {
        guard.className = 'mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4';
        title.textContent = 'API Key Gemini aktif';
        desc.textContent = 'Kunci tersimpan aman di perangkat ini. Fitur Scan Gizi siap dipakai warga.';
        inputField.value = GEMINI_API_KEY;
    } else {
        guard.className = 'mb-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4';
        title.textContent = 'API Key Gemini belum terpasang';
        desc.textContent = 'Atur kunci API Gemini di sini agar fitur Scan Gizi warga bisa berjalan.';
        inputField.value = '';
    }
}

function simpanGeminiKey() {
    const keyInput = document.getElementById('web-gemini-key').value.trim();
    if (!keyInput) {
        tampilkanToast('Masukkan API Key terlebih dahulu.', 'error');
        return;
    }
    localStorage.setItem('gemini_api_key', keyInput);
    GEMINI_API_KEY = keyInput;
    initGeminiKeyGuard();
    tampilkanToast('API Key Gemini berhasil disimpan.');
    loadRingkasanDashboard();
}

/* ============================================================
 * AUTENTIKASI KADER — query ke tabel admin_accounts di Supabase
 * ============================================================ */

function isKaderAuthenticated() {
    return sessionStorage.getItem(KADER_AUTH_KEY) === 'true';
}

/** Klik menu Kader: cek session, tampilkan login atau dashboard */
function bukaHalamanKader() {
    if (isKaderAuthenticated()) {
        switchView('view-admin');
    } else {
        switchView('view-login-kader');
    }
}

function logoutKader() {
    sessionStorage.removeItem(KADER_AUTH_KEY);
    document.getElementById('form-login-kader')?.reset();
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.classList.add('hidden');
    tampilkanToast('Anda telah keluar dari area kader.');
    switchView('view-landing');
}

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login-kader');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-login-kader');
            const errEl = document.getElementById('login-error');
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            btn.disabled = true;
            btn.textContent = 'Memverifikasi...';
            errEl.classList.add('hidden');

            try {
                /* --- KEAMANAN: query ke tabel admin_accounts di Supabase --- */
                const { data, error } = await _supabase
                    .from('admin_accounts')
                    .select('id')
                    .eq('username', username)
                    .eq('password', password)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    // Kredensial cocok — berikan akses
                    sessionStorage.setItem(KADER_AUTH_KEY, 'true');
                    document.getElementById('form-login-kader').reset();
                    tampilkanToast('Selamat datang, Kader.');
                    switchView('view-admin');
                } else {
                    // Tidak ditemukan di database
                    errEl.textContent = 'Username atau password salah. Silakan coba lagi.';
                    errEl.classList.remove('hidden');
                }
            } catch (err) {
                console.error('[Login Kader]', err);
                errEl.textContent = 'Terjadi kesalahan saat login: ' + err.message;
                errEl.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Masuk Dashboard';
            }
        });
    }
});

/* ============================================================
 * SPA VIEW ROUTER
 * ============================================================ */

function switchView(viewId) {
    // Lindungi dashboard admin — wajib login kader
    if (viewId === 'view-admin' && !isKaderAuthenticated()) {
        viewId = 'view-login-kader';
    }

    document.querySelectorAll('.spa-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');

    if (viewId === 'view-admin') {
        initAdminDashboard();
    }
    if (viewId === 'view-scan-gizi') renderDropdownAnak();

    // Auto scroll ke atas setiap pindah view
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Inisialisasi penuh dashboard kader setelah login / akses admin */
function initAdminDashboard() {
    initGeminiKeyGuard();
    isiTanggalHariIni();
    switchAdminTab('ringkasan');
    loadAnakDropdown();
    fetchDataAnakAdmin();
    loadTabelPemeriksaanBulanan();
    loadLogNutrisiAI();
    loadRingkasanDashboard();
}

/** Tab navigasi internal dashboard kader */
function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-panel').forEach(panel => panel.classList.add('hidden'));
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-emerald-600', 'text-white');
        btn.classList.add('bg-slate-100', 'text-slate-700');
    });

    const panel = document.getElementById('admin-tab-' + tabName);
    const btn = document.getElementById('tab-btn-' + tabName);
    if (panel) panel.classList.remove('hidden');
    if (btn) {
        btn.classList.add('active', 'bg-emerald-600', 'text-white');
        btn.classList.remove('bg-slate-100', 'text-slate-700');
    }

    if (tabName === 'ringkasan') loadRingkasanDashboard();
    if (tabName === 'data-anak') fetchDataAnakAdmin();
    if (tabName === 'catatan-bulanan') {
        isiTanggalHariIni();
        loadAnakDropdown();
        loadTabelPemeriksaanBulanan();
    }
    if (tabName === 'log-nutrisi') loadLogNutrisiAI();
}

function isiTanggalHariIni() {
    const el = document.getElementById('pemeriksaan-tanggal');
    if (el) el.value = new Date().toISOString().split('T')[0];
}

/* ============================================================
 * REGISTRASI ANAK → SUPABASE
 * ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const formReg = document.getElementById('form-registrasi');
    if (formReg) {
        formReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-registrasi');
            btn.disabled = true;
            btn.textContent = 'Menyimpan...';

            const payload = {
                user_id: DUMMY_UUID,
                nama_anak: document.getElementById('reg-nama-anak').value.trim(),
                tanggal_lahir: document.getElementById('reg-tgl-lahir').value,
                jenis_kelamin: document.getElementById('reg-jk').value,
                nama_ibu: document.getElementById('reg-nama-ibu').value.trim(),
                no_hp: document.getElementById('reg-nohp').value.trim(),
                bb_lahir: parseFloat(document.getElementById('reg-bb').value) || null,
                tb_lahir: parseFloat(document.getElementById('reg-tb').value) || null
            };

            try {
                const { error } = await _supabase.from('anak').insert([payload]);
                if (error) throw error;

                document.getElementById('form-registrasi').reset();

                // Muat ulang cache & dropdown scan — tanpa refresh browser
                await muatDaftarAnak();
                const anakBaru = cacheDaftarAnak.find(a => a.nama_anak === payload.nama_anak);
                renderDropdownAnak(anakBaru?.id || null);

                tampilkanToast('Profil anak berhasil disimpan.');
                switchView('view-landing');
            } catch (err) {
                console.error('[Registrasi]', err);
                tampilkanToast('Gagal menyimpan: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Simpan Profil Anak';
            }
        });
    }
});

/* ============================================================
 * ADMIN DASHBOARD — Data Anak
 * ============================================================ */

async function fetchDataAnakAdmin() {
    const tbody = document.getElementById('tabel-anak-admin');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400">Menyinkronkan data...</td></tr>';

    try {
        const { data, error } = await _supabase
            .from('anak')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-500">Belum ada anak yang terdaftar.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => {
            const jkClass = item.jenis_kelamin === 'L'
                ? 'bg-sky-50 text-sky-700'
                : 'bg-rose-50 text-rose-700';
            return `
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition">
                    <td class="p-4 font-semibold text-slate-900">${escapeHtml(item.nama_anak)}</td>
                    <td class="p-4">${escapeHtml(formatTanggalUmur(item.tanggal_lahir))}</td>
                    <td class="p-4"><span class="text-sm font-bold px-2.5 py-1 rounded-lg ${jkClass}">${item.jenis_kelamin}</span></td>
                    <td class="p-4">${escapeHtml(item.nama_ibu)}</td>
                    <td class="p-4 text-emerald-700 font-medium">${escapeHtml(item.no_hp)}</td>
                    <td class="p-4 text-slate-500">${item.bb_lahir ?? '—'} kg / ${item.tb_lahir ?? '—'} cm</td>
                    <td class="p-4">
                        <button type="button" data-anak-id="${item.id}" data-anak-nama="${escapeHtml(item.nama_anak)}"
                            onclick="hapusDataAnak(this.dataset.anakId, this.dataset.anakNama)"
                            class="text-sm font-bold text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer">
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('[Admin Fetch]', err);
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-600 font-medium">Gagal memuat data: ${escapeHtml(err.message)}</td></tr>`;
    }
}

/** Hapus profil anak (CRUD — Delete) */
async function hapusDataAnak(anakId, namaAnak) {
    if (!confirm(`Yakin hapus data anak "${namaAnak}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
        const { error } = await _supabase.from('anak').delete().eq('id', anakId);
        if (error) throw error;

        tampilkanToast('Data anak berhasil dihapus.');
        await muatDaftarAnak();
        renderDropdownAnak();
        loadAnakDropdown();
        fetchDataAnakAdmin();
        loadRingkasanDashboard();
    } catch (err) {
        console.error('[Hapus Anak]', err);
        tampilkanToast('Gagal menghapus: ' + err.message, 'error');
    }
}

/** Ringkasan statistik dashboard kader */
async function loadRingkasanDashboard() {
    const elTotalAnak = document.getElementById('stat-total-anak');
    const elPemeriksaan = document.getElementById('stat-pemeriksaan-bulan');
    const elNutrisi = document.getElementById('stat-total-nutrisi');
    const elGemini = document.getElementById('stat-gemini-status');
    if (!elTotalAnak) return;

    try {
        const now = new Date();
        const awalBulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const [resAnak, resPemeriksaan, resNutrisi] = await Promise.all([
            _supabase.from('anak').select('id', { count: 'exact', head: true }),
            _supabase.from('timbangan_bulanan').select('id', { count: 'exact', head: true }).gte('tanggal_timbang', awalBulan),
            _supabase.from('harian_nutrisi').select('id', { count: 'exact', head: true })
        ]);

        elTotalAnak.textContent = resAnak.count ?? 0;
        elPemeriksaan.textContent = resPemeriksaan.error ? '—' : (resPemeriksaan.count ?? 0);
        elNutrisi.textContent = resNutrisi.count ?? 0;
        elGemini.textContent = GEMINI_API_KEY ? 'Aktif ✓' : 'Belum diatur';
        elGemini.className = GEMINI_API_KEY
            ? 'text-base font-bold text-emerald-700 mt-2'
            : 'text-base font-bold text-amber-700 mt-2';
    } catch (err) {
        console.error('[Ringkasan]', err);
    }
}

/** Load dropdown anak untuk form pemeriksaan bulanan */
async function loadAnakDropdown() {
    const select = document.getElementById('pemeriksaan-anak-id');
    if (!select) return;

    try {
        const { data, error } = await _supabase
            .from('anak')
            .select('id, nama_anak')
            .order('nama_anak', { ascending: true });

        if (error) throw error;

        const nilaiSebelumnya = select.value;

        if (!data || data.length === 0) {
            select.innerHTML = '<option value="">Belum ada anak terdaftar</option>';
            return;
        }

        select.innerHTML =
            '<option value="">— Pilih anak —</option>' +
            data.map(a => `<option value="${a.id}">${escapeHtml(a.nama_anak)}</option>`).join('');

        if (nilaiSebelumnya && data.some(a => a.id === nilaiSebelumnya)) {
            select.value = nilaiSebelumnya;
        }
    } catch (err) {
        console.error('[loadAnakDropdown]', err);
        select.innerHTML = '<option value="">Gagal memuat daftar anak</option>';
        tampilkanToast('Gagal memuat dropdown anak: ' + err.message, 'error');
    }
}

/** Simpan data pemeriksaan bulanan ke tabel 'timbangan_bulanan' */
async function simpanPemeriksaanBulanan() {
    const anakId = document.getElementById('pemeriksaan-anak-id').value;
    const tanggalTimbang = document.getElementById('pemeriksaan-tanggal').value || new Date().toISOString().split('T')[0];
    const bb = parseFloat(document.getElementById('pemeriksaan-bb').value);
    const tb = parseFloat(document.getElementById('pemeriksaan-tb').value);
    const lk = parseFloat(document.getElementById('pemeriksaan-lk').value) || null;
    const catatan = document.getElementById('pemeriksaan-catatan').value;
    const bulanKe = 1;

    if (!anakId || !bb || !tb) {
        alert('Mohon isi Nama Anak, Berat Badan, dan Tinggi Badan!');
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('timbangan_bulanan')
            .insert([{
                anak_id: anakId,
                berat_badan: bb,
                tinggi_badan: tb,
                lingkar_kepala: lk,
                bulan_ke: bulanKe,
                catatan_kader: catatan,
                tanggal_timbang: tanggalTimbang
            }]);

        if (error) throw error;

        alert('Data pemeriksaan bulanan berhasil disimpan!');

        document.getElementById('pemeriksaan-bb').value = '';
        document.getElementById('pemeriksaan-tb').value = '';
        document.getElementById('pemeriksaan-lk').value = '';
        document.getElementById('pemeriksaan-catatan').value = '';

        loadTabelPemeriksaanBulanan();
        loadRingkasanDashboard();

    } catch (error) {
        console.error('Error simpan data:', error.message);
        alert('Gagal menyimpan data: ' + error.message);
    }
}

/** Menampilkan rekapan dari tabel 'timbangan_bulanan' */
async function loadTabelPemeriksaanBulanan() {
    try {
        const { data, error } = await _supabase
            .from('timbangan_bulanan')
            .select(`
                id, tanggal_timbang, berat_badan, tinggi_badan, lingkar_kepala, bulan_ke, catatan_kader,
                anak ( nama_anak )
            `)
            .order('tanggal_timbang', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('tabel-pemeriksaan-bulanan');
        if (!tbody) return;
        tbody.innerHTML = '';

        const filterEl = document.getElementById('filter-bulan-timbang');
        const filterBulan = filterEl ? filterEl.value : 'all';

        const filteredData = data.filter(item => {
            if (filterBulan === 'all') return true;
            return item.tanggal_timbang && item.tanggal_timbang.includes(filterBulan);
        });

        if (filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center p-6 text-slate-400 bg-slate-50/30 rounded-b-xl text-sm">Tidak ada data pemeriksaan pada bulan terpilih.</td></tr>`;
            return;
        }

        filteredData.forEach((item) => {
            const namaAnak = item.anak ? item.anak.nama_anak : 'Tidak Diketahui';

            let tglFormatted = '—';
            if (item.tanggal_timbang) {
                const parts = item.tanggal_timbang.split('-');
                if (parts.length === 3) {
                    const d = new Date(parts[0], parts[1] - 1, parts[2]);
                    tglFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                }
            }

            tbody.innerHTML += `
                <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td class="p-3 text-slate-600 text-sm whitespace-nowrap">${tglFormatted}</td>
                    <td class="p-3 text-slate-800 font-semibold text-sm">${escapeHtml(namaAnak)}</td>
                    <td class="p-3 text-emerald-600 font-bold text-sm whitespace-nowrap">${item.berat_badan} kg</td>
                    <td class="p-3 text-slate-700 text-sm whitespace-nowrap">${item.tinggi_badan} cm</td>
                    <td class="p-3 text-slate-700 text-sm whitespace-nowrap">${item.lingkar_kepala ? item.lingkar_kepala + ' cm' : '-'}</td>
                    <td class="p-3 text-slate-500 text-xs max-w-xs truncate" title="${escapeHtml(item.catatan_kader || '')}">
                        ${escapeHtml(item.catatan_kader) || '-'}
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error rekap bulanan:', error.message);
        const tbody = document.getElementById('tabel-pemeriksaan-bulanan');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center p-6 text-red-500 font-medium text-sm">Gagal memuat data: ${error.message}</td></tr>`;
        }
    }
}

/** Muat log scan nutrisi AI dari harian_nutrisi */
async function loadLogNutrisiAI() {
    try {
        const { data, error } = await _supabase
            .from('harian_nutrisi')
            .select(`
                id, tanggal_scan, foto_url, analisis_ai, status_gizi_hari_ini,
                anak ( id, nama_anak )
            `)
            .order('tanggal_scan', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('log-nutrisi-container');
        if (!container) return;
        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-center p-4">Belum ada riwayat scan makanan harian.</p>';
            return;
        }

        const groupedByAnak = {};
        data.forEach(item => {
            if (!item.anak) return;
            const anakId = item.anak.id;
            if (!groupedByAnak[anakId]) {
                groupedByAnak[anakId] = {
                    namaAnak: item.anak.nama_anak,
                    logs: []
                };
            }
            groupedByAnak[anakId].logs.push(item);
        });

        Object.keys(groupedByAnak).forEach(anakId => {
            const grup = groupedByAnak[anakId];
            const totalScan = grup.logs.length;
            const collapseId = `collapse-anak-${anakId}`;

            container.innerHTML += `
                <div class="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <button onclick="document.getElementById('${collapseId}').classList.toggle('hidden')" 
                        class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 font-semibold text-slate-800 transition">
                        <div class="flex items-center gap-2">
                            <span>👦 ${grup.namaAnak}</span>
                            <span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">${totalScan} Kali Scan</span>
                        </div>
                        <span class="text-slate-400 text-sm">Klik untuk Detail ▾</span>
                    </button>

                    <div id="${collapseId}" class="hidden p-4 border-t border-slate-100 bg-white">
                        <div class="mb-4 p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-sm text-amber-900">
                            <strong>📌 Ringkasan Nutrisi:</strong> Anak ini telah dipantau sesering <span class="font-bold">${totalScan} kali</span> melalui AI. Selalu pastikan variasi menu makanannya seimbang untuk mendukung tumbuh kembang optimalnya ya, Ibu!
                        </div>

                        <div class="space-y-4">
                            ${grup.logs.map(log => {
                                const tglLog = new Date(log.tanggal_scan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                                return `
                                    <div class="flex flex-col md:flex-row gap-4 p-3 border border-slate-100 rounded-lg bg-slate-50/30">
                                        ${log.foto_url ? `<img src="${log.foto_url}" class="w-24 h-24 object-cover rounded-lg border border-slate-200" alt="Foto Makanan">` : ''}
                                        <div class="flex-1">
                                            <div class="flex justify-between items-center mb-1">
                                                <span class="text-xs font-medium text-slate-400">${tglLog}</span>
                                                <span class="px-2 py-0.5 rounded text-xs font-bold ${log.status_gizi_hari_ini === 'Cukup' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                                                    Gizi ${log.status_gizi_hari_ini}
                                                </span>
                                            </div>
                                            <div class="text-sm text-slate-700 leading-relaxed">${log.analisis_ai.replace(/\n/g, '<br>')}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Error load log nutrisi:', error.message);
    }
}

/* ============================================================
 * DROPDOWN ANAK — sinkron otomatis
 * ============================================================ */

/** Cache daftar anak untuk sinkronisasi dropdown tanpa refresh halaman */
let cacheDaftarAnak = [];

async function muatDaftarAnak() {
    try {
        const { data, error } = await _supabase
            .from('anak')
            .select('id, nama_anak')
            .order('nama_anak', { ascending: true });

        if (error) throw error;
        cacheDaftarAnak = data || [];
    } catch (err) {
        console.error('[Dropdown]', err);
        cacheDaftarAnak = [];
    }
}

function renderDropdownAnak(pilihId = null) {
    const select = document.getElementById('scan-anak-id');
    const nilaiSebelumnya = pilihId || select.value;

    if (!cacheDaftarAnak.length) {
        select.innerHTML = '<option value="">Belum ada anak terdaftar — daftar dulu ya</option>';
        return;
    }

    select.innerHTML =
        '<option value="">— Pilih anak —</option>' +
        cacheDaftarAnak.map(a =>
            `<option value="${a.id}">${escapeHtml(a.nama_anak)}</option>`
        ).join('');

    if (nilaiSebelumnya && cacheDaftarAnak.some(a => a.id === nilaiSebelumnya)) {
        select.value = nilaiSebelumnya;
    }
}

async function populateDropdownAnak() {
    await muatDaftarAnak();
    renderDropdownAnak();
}

/* ============================================================
 * INISIALISASI SAAT HALAMAN DIBUKA
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    muatDaftarAnak().then(() => {
        renderDropdownAnak();
        switchView('view-landing'); // Memastikan aplikasi selalu memulai dari Landing Page
    });
});
