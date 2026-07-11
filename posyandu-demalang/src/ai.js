/* ============================================================
 * ai.js — Posyandu Demalang
 * Seluruh logika scan gizi makanan menggunakan Gemini AI
 * Bergantung pada: supabase.js (untuk _supabase & escapeHtml yg ada di admin.js)
 * ============================================================ */

const GEMINI_MODEL = 'gemini-2.5-flash';

/** API Key Gemini disimpan lokal di browser pengguna */
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key') || '';

/** Simpan base64 terakhir agar tidak dibaca ulang saat analisis */
let fotoBase64Cache = null;
let fotoMimeTypeCache = 'image/jpeg';

/* ============================================================
 * PREVIEW FOTO — base64 & rasio aspek aman
 * ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const inputFoto = document.getElementById('input-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', function () {
            previewImage(this);
        });
    }
});

function previewImage(input) {
    const file = input.files && input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        tampilkanToast('File harus berupa gambar.', 'error');
        input.value = '';
        return;
    }

    fotoMimeTypeCache = file.type || 'image/jpeg';

    const reader = new FileReader();
    reader.onload = function (e) {
        const dataUrl = e.target.result;
        fotoBase64Cache = dataUrl.split(',')[1];

        const img = document.getElementById('preview-foto');
        img.onload = function () {
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.maxHeight = '16rem';
            img.style.maxWidth = '100%';
        };
        img.src = dataUrl;

        document.getElementById('preview-wrapper').classList.remove('hidden');
        document.getElementById('upload-placeholder').classList.add('hidden');
        document.getElementById('hasil-scan-container').classList.add('hidden');
    };
    reader.onerror = function () {
        tampilkanToast('Gagal membaca foto. Coba lagi ya.', 'error');
    };
    reader.readAsDataURL(file);
}

/** Konversi file ke base64 (fallback jika cache kosong) */
function fileKeBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                resolve(result.split(',')[1]);
            } else {
                reject(new Error('Format foto tidak dikenali.'));
            }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
        reader.readAsDataURL(file);
    });
}

/* ============================================================
 * AI VISION FOOD GUARD — Gemini 2.5 Flash
 * ============================================================ */

function parseResponsGizi(teksMentah) {
    const teks = teksMentah.trim();

    if (/STATUS:\s*BUKAN_MAKANAN/i.test(teks)) {
        return { valid: false };
    }

    if (!/STATUS:\s*MAKANAN_VALID/i.test(teks)) {
        const lower = teks.toLowerCase();
        if (lower.includes('bukan makanan') || lower.includes('bukan_makanan') || lower.includes('tidak ada makanan')) {
            return { valid: false };
        }
    }

    const kesimpulanMatch = teks.match(/\[KESIMPULAN_STATUS\]:\s*(.+)/i);
    let statusGizi = 'Cukup';
    if (kesimpulanMatch && /kurang/i.test(kesimpulanMatch[1])) statusGizi = 'Kurang';

    return { valid: true, statusGizi };
}

function teksKeHtmlAman(teks) {
    return escapeHtml(teks).replace(/\n/g, '<br>');
}

function tampilkanModalBukanMakanan() {
    document.getElementById('modal-bukan-makanan').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function tutupModalBukanMakanan() {
    document.getElementById('modal-bukan-makanan').classList.add('hidden');
    document.body.style.overflow = '';
}

async function prosesScanGiziAI() {
    if (!GEMINI_API_KEY) {
        tampilkanToast('Fitur scan belum aktif. Minta kader Posyandu untuk mengatur API Key Gemini.', 'error');
        return;
    }

    const anakId = document.getElementById('scan-anak-id').value;
    const fileInput = document.getElementById('input-foto');
    const btn = document.getElementById('btn-scan-gizi');

    if (!anakId) {
        tampilkanToast('Pilih anak terlebih dahulu ya, Bu.', 'error');
        return;
    }
    if (!fileInput.files || !fileInput.files.length) {
        tampilkanToast('Ambil foto makanan dulu sebelum analisis.', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Sedang menganalisis...';
    document.getElementById('hasil-scan-container').classList.add('hidden');

    try {
        const file = fileInput.files[0];
        const base64Data = fotoBase64Cache || await fileKeBase64(file);
        const mimeType = fotoMimeTypeCache || file.type || 'image/jpeg';

        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

        const systemInstructions = `Kamu adalah seorang Dokter Anak dan Kader Ahli Gizi Posyandu yang ramah dan bersahabat. Tugasmu adalah meringkas hasil analisis foto makanan menjadi poin-poin utama yang sangat ringkas, padat, dan mudah dipahami oleh ibu-ibu.

Aturan Output:
1. JIKA gambar terbukti secara visual BUKAN makanan/minuman, kamu WAJIB membalas HANYA: "STATUS: BUKAN_MAKANAN"
2. JIKA gambar makanan/minuman valid, berikan output dengan format wajib dan struktur ringkas seperti ini (Gunakan bahasa Indonesia yang santun, ceria, dan hindari penjelasan bertele-tele):

STATUS: MAKANAN_VALID
[KESIMPULAN_STATUS]: Cukup

Identifikasi Menu Singkat:
• Nama Makanan: [Nama menu di foto]
• Porsi Balita: [Berikan catatan singkat apakah porsinya sudah pas, atau perlu dikurangi/ditambah untuk balita]

Estimasi Kandungan Gizi Utama (Ringkas):
• 🍲 Kalori: ± [X] kkal
• 🥩 Protein (Zat Pembangun): ± [X] gram
• 🍚 Karbohidrat (Sumber Energi): ± [X] gram
• 🥑 Lemak: ± [X] gram

Ulasan Penting & Saran Praktis Ibu (Maksimal 3 Poin Pendek):
• 🌟 Manfaat Utama: [1 kalimat pendek tentang manfaat menu ini untuk tumbuh kembang/otak anak]
• 🥄 Takaran Saran: [1 kalimat saran takaran praktis, misal: ambil 2-3 sendok makan nasi, potong ayam sekecil dadu, dll]
• 💡 Tips Tambahan: [1 kalimat tips pendukung, misal: bisa divariasikan dengan buah, atau pastikan teksturnya empuk]`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemInstructions },
                        { inlineData: { mimeType: mimeType, data: base64Data } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4096
                }
            })
        });

        const json = await response.json();

        if (!response.ok || json.error) {
            const msg = json.error?.message || `HTTP ${response.status}`;
            throw new Error(msg);
        }

        const candidate = json.candidates?.[0];
        if (!candidate?.content?.parts?.length) {
            throw new Error('AI tidak mengembalikan hasil. Coba foto ulang dengan pencahayaan lebih terang.');
        }

        const aiResultText = candidate.content.parts
            .filter(p => p.text)
            .map(p => p.text)
            .join('');

        if (!aiResultText.trim()) {
            throw new Error('AI tidak mengembalikan teks. Coba foto ulang dengan pencahayaan lebih terang.');
        }

        const parsed = parseResponsGizi(aiResultText);

        if (!parsed.valid) {
            tampilkanModalBukanMakanan();
            return;
        }

        const badge = document.getElementById('badge-status-gizi');
        const outputContainer = document.getElementById('hasil-scan-container');

        let cleanText = aiResultText
            .replace("STATUS: MAKANAN_VALID", "")
            .replace("[KESIMPULAN_STATUS]: Cukup", "")
            .replace("[KESIMPULAN_STATUS]: Kurang", "")
            .trim();

        document.getElementById('text-analisis-ai').innerHTML = teksKeHtmlAman(cleanText);

        badge.textContent = 'Gizi ' + parsed.statusGizi;
        badge.className = parsed.statusGizi === 'Cukup'
            ? 'text-sm font-bold px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800'
            : 'text-sm font-bold px-4 py-1.5 rounded-full bg-amber-100 text-amber-800';

        outputContainer.classList.remove('hidden');

        const analisisBersih = cleanText;

        const { error: dbError } = await _supabase.from('harian_nutrisi').insert([{
            anak_id: anakId,
            analisis_ai: analisisBersih,
            status_gizi_hari_ini: parsed.statusGizi,
            foto_url: null
        }]);

        if (dbError) {
            console.error('[harian_nutrisi]', dbError);
            tampilkanToast('Analisis selesai, tapi gagal disimpan ke database: ' + dbError.message, 'error');
        } else {
            tampilkanToast('Hasil analisis gizi berhasil dicatat.');
        }

    } catch (err) {
        console.error('[Scan Gizi]', err);
        tampilkanToast('Kesalahan: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Mulai Analisis Gizi';
    }
}
