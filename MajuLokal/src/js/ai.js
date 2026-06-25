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
        temperature:      1,
        topP:             0.95,
        maxOutputTokens:  8192,
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
function _parseJSONArray(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = cleaned.indexOf('[');
  const end   = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) {
    console.error('[Gemini] Cannot find JSON array in text:', cleaned.slice(0, 300));
    throw new Error('Tidak menemukan JSON di respons AI.');
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (parseErr) {
    console.error('[Gemini] JSON.parse failed on array:', parseErr, cleaned.slice(start, end + 1).slice(0, 500));
    throw new Error('Gagal mem-parse respons AI sebagai JSON. Coba generate ulang.');
  }
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

PENTING: Balas HANYA dengan format JSON valid berikut ini, tanpa teks lain, tanpa markdown, tanpa kode block:
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
      console.error('[Gemini] generateBusinessOptions: unexpected array length:', parsed.length);
      throw new Error('Format respons AI tidak valid — tidak tepat 3 opsi. Coba generate ulang.');
    }

    console.debug('[Gemini] generateBusinessOptions: parsed', parsed.length, 'options');
    return parsed;
  } catch (err) {
    console.error('[Gemini] generateBusinessOptions error:', err);
    throw err;
  }
}

/**
 * Generate 4-channel daily marketing content.
 * @param {{ nama_user: string, ide_bisnis_terpilih: string, kondisi_lingkungan: string }} userProfile
 * @param {string} dailyPrompt - The user's short daily instruction.
 * @returns {Promise<{ whatsapp: string, instagram: string, facebook: string, tiktok: string }>}
 */
export async function generateDailyPromos(userProfile, dailyPrompt) {
  const prompt = `Kamu adalah pakar konten pemasaran UMKM di Indonesia yang memahami karakteristik setiap platform media sosial.

Profil Bisnis:
- Nama Pemilik  : ${userProfile.nama_user || '-'}
- Jenis Bisnis  : ${userProfile.ide_bisnis_terpilih || '-'}
- Kondisi       : ${userProfile.kondisi_lingkungan || '-'}

Perintah Promosi Hari Ini:
"${dailyPrompt}"

Tugas: Buat 4 variasi konten promosi yang SIAP PAKAI, berbeda karakter untuk setiap platform:

1. [WHATSAPP] Status WhatsApp personal dan akrab (maks 200 karakter), menggunakan bahasa sehari-hari, emoji, dan CTA yang humanis.
2. [INSTAGRAM] Caption Instagram estetik dengan storytelling singkat, hashtag relevan (#), dan CTA engaging. Tambahkan juga ide konten visual.
3. [FACEBOOK] Post Facebook grup komunitas warga dengan gaya storytelling cerita nyata yang hangat dan relatable, lebih panjang, mengajak interaksi.
4. [TIKTOK] Hook pembuka TikTok yang memikat (3 detik pertama), script singkat konten video (30-60 detik), dan rekomendasi ide visual video yang kreatif.

PENTING: Balas HANYA dengan format JSON valid berikut, tanpa teks lain. Pastikan struktur JSON sesuai persis:
{
  "whatsapp": "Teks caption status WhatsApp...",
  "instagram": {
    "caption": "Teks caption Instagram dengan hashtag...",
    "ide_konten": "Ide konsep visual/foto...",
    "langkah": ["Langkah 1...", "Langkah 2...", "Langkah 3..."]
  },
  "facebook": {
    "caption": "Teks caption storytelling Facebook...",
    "ide_konten": "Ide gambar/foto interaktif...",
    "langkah": ["Langkah 1...", "Langkah 2..."]
  },
  "tiktok": {
    "caption": "Teks caption video TikTok...",
    "ide_konten": "Ide skenario visual/hook...",
    "langkah": ["Langkah 1 (3 detik pertama)...", "Langkah 2...", "Langkah 3..."]
  }
}`;

  try {
    const rawText = await _callGemini(prompt);
    const parsed  = _parseJSONObject(rawText);

    if (!parsed.whatsapp || !parsed.instagram || !parsed.facebook || !parsed.tiktok) {
      console.error('[Gemini] generateDailyPromos: missing fields in response:', Object.keys(parsed));
      throw new Error('Respons AI tidak lengkap (ada platform yang kosong). Coba generate ulang.');
    }

    console.debug('[Gemini] generateDailyPromos: all 4 channels received.');
    return {
      whatsapp:  parsed.whatsapp,
      instagram: parsed.instagram,
      facebook:  parsed.facebook,
      tiktok:    parsed.tiktok,
    };
  } catch (err) {
    console.error('[Gemini] generateDailyPromos error:', err);
    throw err;
  }
}
