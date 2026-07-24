// ─────────────────────────────────────────────────────────────────────────────
// ai.js  —  Gemini API communication and prompt templates for MajuLokal
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Retrieve the Gemini API key from localStorage.
 * @returns {string}
 */
export function getGeminiKey() {
  return localStorage.getItem(CONFIG.gemini.localStorageKey) || '';
}

/**
 * Core Gemini REST call.
 * @param {string} prompt - The full prompt text.
 * @returns {Promise<string>} Raw text from the model.
 */
async function _callGemini(prompt) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error(
      'Gemini API Key belum dikonfigurasi. Silakan masuk ke menu Admin untuk mengaturnya.'
    );
  }

  const url = `${CONFIG.gemini.endpoint}?key=${apiKey}`;
  console.debug('[Gemini] POST', url.replace(apiKey, '***'));

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:      0.7,
        maxOutputTokens:  2048,
        responseMimeType: "application/json"
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let friendlyMsg = 'Gagal memanggil Gemini API.';
    try {
      const errObj = JSON.parse(errText);
      if (errObj?.error?.message) {
        friendlyMsg = 'Gemini: ' + errObj.error.message;
      }
    } catch (_) {
      // Keep generic message if JSON parse fails
    }
    console.error('[Gemini] API error:', response.status, errText);
    throw new Error(friendlyMsg);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error('[Gemini] Empty response body:', data);
    throw new Error('Gemini tidak menghasilkan respons. Coba lagi.');
  }

  console.debug('[Gemini] Raw response length:', text.length);
  return text;
}

/**
 * Strip markdown code fences and extract a JSON array from raw Gemini text.
 * @param {string} text
 * @returns {Array}
 */
function getFallbackBusinessIdeas() {
  return [
    {
      "nama_bisnis": "Warung Kopi & Camilan Hemat",
      "tagline": "Sederhana, Hemat, Dekat di Hati",
      "deskripsi": "Konsep warung keliling/angkringan modern dengan modal terjangkau yang menargetkan pekerja dan masyarakat sekitar.",
      "estimasi_pendapatan": "Rp 1.000.000 - Rp 3.000.000 / bulan",
      "modal_dibutuhkan": "Rp 500.000 - Rp 1.000.000",
      "roadmap_4_minggu": [
        { "minggu": 1, "judul": "Persiapan Konsep", "tugas": ["Tentukan lokasi jualan", "Beli perlengkapan", "Tes resep minuman"] },
        { "minggu": 2, "judul": "Mulai Jualan", "tugas": ["Buka lapak perdana", "Sebar info ke warga", "Mulai sapa pelanggan"] },
        { "minggu": 3, "judul": "Evaluasi Menu", "tugas": ["Cek menu terlaris", "Tambah variasi camilan", "Minta masukan pelanggan"] },
        { "minggu": 4, "judul": "Bangun Pelanggan", "tugas": ["Buat promo bundling", "Rapikan catatan keuangan", "Siapkan stok harian konsisten"] }
      ]
    },
    {
      "nama_bisnis": "Jasa Titip & Kurir Lokal",
      "tagline": "Cepat, Aman, dan Tepercaya",
      "deskripsi": "Layanan pengantaran barang/makanan cepat skala area lokal untuk kebutuhan harian warga.",
      "estimasi_pendapatan": "Rp 800.000 - Rp 2.000.000 / bulan",
      "modal_dibutuhkan": "Mulai dari Rp 100.000",
      "roadmap_4_minggu": [
        { "minggu": 1, "judul": "Pemetaan Wilayah", "tugas": ["Tentukan area layanan", "Siapkan tarif dasar", "Mulai info ke tetangga"] },
        { "minggu": 2, "judul": "Operasional Awal", "tugas": ["Terima pesanan pertama", "Jaga waktu pengiriman", "Kumpulkan review bagus"] },
        { "minggu": 3, "judul": "Perluas Promosi", "tugas": ["Sebar info di grup WA RT", "Kerjasama dengan warung makan", "Optimasi rute jalan"] },
        { "minggu": 4, "judul": "Evaluasi Waktu", "tugas": ["Pelajari jam sibuk", "Buat jam operasional tetap", "Catat pengeluaran operasional"] }
      ]
    },
    {
      "nama_bisnis": "Layanan Katering Rumahan Harian",
      "tagline": "Masakan Rumahan Praktis Setiap Hari",
      "deskripsi": "Penyediaan menu masakan sehat siap saji dengan sistem prapemesanan (PO) harian.",
      "estimasi_pendapatan": "Rp 2.000.000 - Rp 5.000.000 / bulan",
      "modal_dibutuhkan": "Rp 1.000.000 - Rp 2.500.000",
      "roadmap_4_minggu": [
        { "minggu": 1, "judul": "Riset Menu", "tugas": ["Tentukan 3 menu andalan", "Hitung modal per porsi", "Beli bahan masakan awal"] },
        { "minggu": 2, "judul": "Tes Pasar", "tugas": ["Tawarkan ke teman/keluarga", "Beri tester gratis", "Kumpulkan masukan rasa"] },
        { "minggu": 3, "judul": "Buka Pre-Order", "tugas": ["Mulai sistem PO harian", "Siapkan kemasan bersih", "Update menu mingguan"] },
        { "minggu": 4, "judul": "Manajemen Bisnis", "tugas": ["Buat jadwal belanja harian", "Pisahkan uang modal dan untung", "Tawarkan paket langganan"] }
      ]
    }
  ];
}

function _parseJSONArray(text) {
  if (!text) return getFallbackBusinessIdeas();

  let cleaned = typeof text === 'string' ? text.trim() : JSON.stringify(text);
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

  // 1. Coba parse biasa
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) {
      for (const key in parsed) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    }
  } catch (e) {}

  // 2. Coba potong dari [ sampai ]
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
    } catch (e) {}
  }

  // 3. JIKA MASIH GAGAL, RETURNING FALLBACK (JANGAN THROW ERROR!)
  console.warn("[Gemini] Parse array gagal total, menggunakan fallback data aman.");
  return getFallbackBusinessIdeas();
}

/**
 * Strip markdown code fences and extract a JSON object from raw Gemini text.
 * @param {string} text
 * @returns {object}
 */
function _parseJSONObject(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    console.error('[Gemini] Cannot find JSON object in text:', cleaned.slice(0, 300));
    throw new Error('Format JSON promosi tidak valid. Coba generate ulang.');
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (parseErr) {
    console.error('[Gemini] JSON.parse failed on object:', parseErr, cleaned.slice(start, end + 1).slice(0, 500));
    throw new Error('Gagal mem-parse respons promosi AI sebagai JSON. Coba generate ulang.');
  }
}

function cleanJsonResponse(text) {
  if (!text) return '{}';
  // Hapus pembungkus markdown ```json dan ``` jika ada
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return cleaned;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate 3 structured business options with 4-week roadmaps.
 * @param {{ nama: string, kondisi: string, modal: number }} input
 * @returns {Promise<Array>} Array of 3 business option objects.
 */
export async function generateBusinessOptions({ nama, kondisi, modal }) {
  const prompt = `Kamu adalah konsultan bisnis UMKM berpengalaman di Indonesia. Bantu seseorang dengan kondisi berikut:

Nama: ${nama}
Kondisi Lingkungan: ${kondisi}
Modal Awal: Rp ${Number(modal).toLocaleString('id-ID')}

Hasilkan tepat 3 opsi ide bisnis yang realistis, lokal, dan sesuai kondisi di atas. Setiap opsi harus memiliki roadmap 4 minggu yang spesifik.

PENTING: Kembalikan HANYA JSON Array murni berisi 3 objek ide bisnis. Contoh persis format output: [ {"nama_bisnis": "...", "deskripsi": "..."}, ... ]. Dilarang membungkusnya dalam nama property objek seperti {"ide": [...]}. Format wajib:
[
  {
    "nama_bisnis": "Nama Bisnis 1",
    "tagline": "Tagline singkat dan menarik",
    "deskripsi": "Deskripsi bisnis 2-3 kalimat yang menjelaskan peluang dan keunggulan.",
    "estimasi_pendapatan": "Rp xxx.xxx - Rp xxx.xxx / bulan",
    "modal_dibutuhkan": "Rp xxx.xxx",
    "roadmap_4_minggu": [
      { "minggu": 1, "judul": "Judul Minggu 1", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 2, "judul": "Judul Minggu 2", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 3, "judul": "Judul Minggu 3", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 4, "judul": "Judul Minggu 4", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] }
    ]
  },
  {
    "nama_bisnis": "Nama Bisnis 2",
    "tagline": "Tagline singkat dan menarik",
    "deskripsi": "Deskripsi bisnis 2-3 kalimat.",
    "estimasi_pendapatan": "Rp xxx.xxx - Rp xxx.xxx / bulan",
    "modal_dibutuhkan": "Rp xxx.xxx",
    "roadmap_4_minggu": [
      { "minggu": 1, "judul": "Judul Minggu 1", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 2, "judul": "Judul Minggu 2", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 3, "judul": "Judul Minggu 3", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 4, "judul": "Judul Minggu 4", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] }
    ]
  },
  {
    "nama_bisnis": "Nama Bisnis 3",
    "tagline": "Tagline singkat dan menarik",
    "deskripsi": "Deskripsi bisnis 2-3 kalimat.",
    "estimasi_pendapatan": "Rp xxx.xxx - Rp xxx.xxx / bulan",
    "modal_dibutuhkan": "Rp xxx.xxx",
    "roadmap_4_minggu": [
      { "minggu": 1, "judul": "Judul Minggu 1", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 2, "judul": "Judul Minggu 2", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 3, "judul": "Judul Minggu 3", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] },
      { "minggu": 4, "judul": "Judul Minggu 4", "tugas": ["Tugas 1", "Tugas 2", "Tugas 3"] }
    ]
  }
]`;

  try {
    const rawText = await _callGemini(prompt);
    const parsed  = _parseJSONArray(rawText);

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      console.warn('[Gemini] generateBusinessOptions: unexpected array length:', parsed?.length);
      return getFallbackBusinessIdeas();
    }

    console.debug('[Gemini] generateBusinessOptions: parsed', parsed.length, 'options');
    return parsed;
  } catch (err) {
    console.error('[Gemini] generateBusinessOptions error:', err);
    return getFallbackBusinessIdeas();
  }
}

/**
 * Attempt to repair a JSON string truncated mid-way by closing open braces/strings.
 * @param {string} jsonString
 * @returns {string}
 */
function repairTruncatedJson(jsonString) {
  let str = jsonString.trim();
  if (!str.startsWith('{')) return str;

  // If it already ends properly, return as-is
  if (str.endsWith('}')) return str;

  // Find last complete property block by scanning for the last '}'
  const lastCompleteProp = str.lastIndexOf('}');
  if (lastCompleteProp !== -1) {
    // Close any unclosed outer objects
    str = str.substring(0, lastCompleteProp + 1);
    // Count open vs close braces to add missing closing braces
    const opens  = (str.match(/\{/g) || []).length;
    const closes = (str.match(/\}/g) || []).length;
    const missing = opens - closes;
    if (missing > 0) {
      str += '}'.repeat(missing);
    }
  } else {
    // Worst-case: just close it
    str += '}}}}';
  }
  return str;
}

export async function generateDailyPromos(userProfile, dailyPrompt, tipeKonten) {
  const prompt = `Kamu adalah pakar konten pemasaran UMKM di Indonesia.

ATURAN — WAJIB DIIKUTI:
- Jawablah dengan RINGKAS dan KOMUNIKATIF. Gunakan bahasa sehari-hari yang mudah dipahami orang awam.
- caption: Buat 3-4 kalimat yang ramah, jelas, dan mengajak pembeli. Langsung ke inti pesan.
- visual: Jelaskan ide foto/video secara konkrit dan simpel dalam 1 kalimat (contoh: "Foto jarak dekat produk saat baru jadi, dengan cahaya alami dari jendela").
- langkah: Berikan tepat 3 poin petunjuk praktis berurutan dengan bahasa orang awam. WAJIB dikembalikan sebagai ARRAY JSON, contoh: ["Poin 1", "Poin 2", "Poin 3"].
- Pastikan seluruh struktur JSON (whatsapp, instagram, facebook, tiktok) selalu tertutup lengkap sampai tanda '}' terakhir.

Profil Bisnis:
- Pemilik: ${userProfile.nama_user || '-'}
- Bisnis : ${userProfile.ide_bisnis_terpilih || '-'}

Tipe Konten: ${tipeKonten}
- TOFU (Perkenalan): Cerita emosional/unik usaha, NO hard selling.
- MOFU (Edukasi): Keunggulan produk, jawab keraguan, bangun kepercayaan.
- BOFU (Promo): Penawaran menarik, CTA beli sekarang, batas waktu/stok.

Perintah Hari Ini: "${dailyPrompt}"

BALAS HANYA JSON MURNI. Mulai dengan { dan akhiri dengan }.
{
  "whatsapp":  { "caption": "...", "visual": "...", "langkah": ["Langkah 1", "Langkah 2", "Langkah 3"] },
  "instagram": { "caption": "...", "visual": "...", "langkah": ["Langkah 1", "Langkah 2", "Langkah 3"] },
  "facebook":  { "caption": "...", "visual": "...", "langkah": ["Langkah 1", "Langkah 2", "Langkah 3"] },
  "tiktok":    { "caption": "...", "visual": "...", "langkah": ["Langkah 1", "Langkah 2", "Langkah 3"] }
}`;

  try {
    const rawText = await _callGemini(prompt);

    let parsed = {};
    try {
      let cleanedText = rawText;
      if (typeof cleanedText === 'string') {
        // Ekstrak dari kurung kurawal pertama { hingga terakhir }
        const firstBracket = cleanedText.indexOf('{');
        const lastBracket  = cleanedText.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket !== -1) {
          cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
        }
        cleanedText = repairTruncatedJson(cleanedText);
      }
      parsed = JSON.parse(cleanedText);
    } catch (err) {
      console.error('[Gemini] Gagal parse JSON asli:', err, rawText);
      // Dummy fallback object agar UI tidak kosong
      parsed = {
        whatsapp:  { caption: 'Konten tidak dapat dimuat. Coba generate ulang.', visual: '-', langkah: '-' },
        instagram: { caption: 'Konten tidak dapat dimuat. Coba generate ulang.', visual: '-', langkah: '-' },
        facebook:  { caption: 'Konten tidak dapat dimuat. Coba generate ulang.', visual: '-', langkah: '-' },
        tiktok:    { caption: 'Konten tidak dapat dimuat. Coba generate ulang.', visual: '-', langkah: '-' },
      };
    }

    console.debug('[Gemini] generateDailyPromos: all 4 channels processed.');
    return {
      whatsapp:  parsed.whatsapp  || parsed.promosi_whatsapp  || { caption: 'Konten tidak tersedia.', visual: '', langkah: '' },
      instagram: parsed.instagram || parsed.promosi_instagram || { caption: 'Konten tidak tersedia.', visual: '', langkah: '' },
      facebook:  parsed.facebook  || parsed.promosi_facebook  || { caption: 'Konten tidak tersedia.', visual: '', langkah: '' },
      tiktok:    parsed.tiktok    || parsed.promosi_tiktok    || { caption: 'Konten tidak tersedia.', visual: '', langkah: '' },
    };
  } catch (err) {
    console.error('[Gemini] generateDailyPromos error:', err);
    throw err;
  }
}
