<div align="center">

# 🍜 Web POS Mie Os
### Sistem Kasir & Manajemen Keuangan Warung Mie Ayam Modern

**Kelola pesanan kasir, pengeluaran, hingga analisis AI bisnis dalam satu platform.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-pos--mieayam.vercel.app-orange?style=for-the-badge)](https://pos-mieayam.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-Analytics-blue?style=for-the-badge&logo=googlegemini)](https://ai.google.dev)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Tentang Mie Os POS

**Web POS Mie Os** adalah aplikasi Point of Sale (Kasir) dan Manajemen Keuangan digital yang dirancang khusus untuk operasional Warung Mie Ayam dan Minuman. Sistem ini membantu pemilik warung mengelola pesanan (Dine-in / Takeaway), melacak biaya operasional, mengarsipkan laporan harian otomatis, mencetak laporan PDF, serta mendapatkan **Analisis Bisnis Berbasis AI** menggunakan Google Gemini AI.

> **100% Menggunakan Infrastructure Free Tier** (Vercel, Supabase, dan Google Gemini API).

---

## ✨ Fitur Utama

- 🔐 **Autentikasi Multi-Role** — Akses terpisah untuk **Owner (Pemilik)** dan **Kasir**.
- 🛒 **POS Kasir Interaktif** — Pilihan cepat *Dine In* (Makan di Tempat) dan *Take Away* (Bungkus) dengan akumulasi biaya otomatis tanpa perlu cetak struk fisik.
- 📋 **Manajemen Menu & Storage** — Atur Harga Jual, Modal Normal, Modal Takeaway, serta upload foto produk ke **Supabase Storage**.
- 💸 **Expense Tracker** — Pencatatan belanja bahan baku & operasional harian untuk perhitungan laba bersih presisi.
- ⏰ **Rekap Automasi (Reset 03:00 WIB)** — Penjadwalan *Cron Job* otomatis jam 03:00 AM WIB untuk merangkum total omset, pengeluaran, dan laba bersih harian.
- 📄 **Export Laporan PDF** — Unduh laporan rekap harian, bulanan, dan tahunan dalam format PDF.
- 🤖 **AI Business Analytics** — Rekomendasi dan analisis strategi bisnis otomatis menggunakan Google Gemini AI API (Key dapat dikonfigurasi dinamis via Halaman Pengaturan).
- 💰 **Format Rupiah & Bahasa Indonesia** — Seluruh tampilan ramah pengguna UMKM Indonesia.

---

### 1. Kredensial Akun Demo

| Role | Email | Password | Akses Utama |
|---|---|---|---|
| **Owner / Admin** | `demo@mieos.com` | `demopassword123` | Dashboard, Menu, Pengeluaran, Rekap/AI, Setting |
| **Kasir** | `kasir@mieos.com` | `kasir123456` | Halaman Kasir & Transaksi Harian |

### 2. 🧪 Langkah-Langkah Demo Web

```text
1️⃣ Skenario 1: Transaksi Kasir (Role Kasir)
   └─ Login menggunakan akun Kasir (kasir@mieos.com).
   └─ Pilih menu makanan/minuman, tentukan opsi 'Dine In' atau 'Take Away'.
   └─ Klik 'Bayar' untuk mengonfirmasi transaksi. Data akan langsung tersimpan di Supabase.

2️⃣ Skenario 2: Kelola Menu & Pengeluaran (Role Owner)
   └─ Logout, lalu Login menggunakan akun Owner (demo@mieos.com).
   └─ Buka menu 'Manajemen Menu' untuk menambah/mengedit produk atau upload gambar produk.
   └─ Buka menu 'Pengeluaran' untuk mencatat belanja bahan baku harian.

3️⃣ Skenario 3: AI Analytics & Laporan PDF (Role Owner)
   └─ Buka menu 'Rekap & AI'.
   └─ Klik tombol 'Generate AI Analysis' untuk mendapatkan insight bisnis dari Google Gemini AI.
   └─ Klik tombol 'Export PDF' untuk mengunduh laporan keuangan harian/bulanan.
```
---

## 🖥️ Screenshot

| Halaman Kasir (POS) | Dashboard Rekap & AI Analytics |
|---|---|
| ![Kasir](docs/kasir.png) | ![Rekap AI](docs/rekap_with-ai.png) |

| Manajemen Menu & Produk | Pengeluaran (Expense) |
|---|---|
| ![Manajemen Menu](docs/sett_menu.png) | ![Pengeluaran](docs/pengeluaran.png) |

| Pengaturan Sistem & API Key |
|---|
| ![Pengaturan Web](docs/setting_web.png) |

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|---|---|
| [Next.js 14](https://nextjs.org) | React Framework (App Router & TypeScript) |
| [Tailwind CSS](https://tailwindcss.com) | Styling UI & Layouting Responsif |
| [Supabase](https://supabase.com) | PostgreSQL Database, Authentication & Storage (`produk-images`) |
| [Google Gemini API](https://ai.google.dev) | Engine Analisis Keuangan & Business Insight |
| [jsPDF](https://github.com/parallax/jsPDF) | Generator Export Laporan PDF |
| [Vercel](https://vercel.com) | Hosting & Deployment Pipeline |

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat
- Node.js versi 18.x atau lebih baru
- Akun [Supabase](https://supabase.com) 
- Akun [Vercel](https://vercel.com) 

### 1. Clone Repository

```bash
git clone [https://github.com/Zoyyyyyyy/MieOs.git](https://github.com/Zoyyyyyyy/MieOs.git)
cd MieOs
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Setup Environment Variables Buat file .env.local di root folder proyek:
```Cuplikan kode
NEXT_PUBLIC_SUPABASE_URL=[https://xxxxxxxxxxxxxx.supabase.co](https://xxxxxxxxxxxxxxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxxxxxxxxxxxxxxxxxx...
```
### 4. Jalankan Development Server
```Bash
npm run dev
```
Buka http://localhost:3000 di browser.🗄️ 
Setup Database & Storage Supabase
### 5. Buat Storage Bucket
1. Buka Dashboard Supabase $\rightarrow$ Storage $\rightarrow$ New Bucket.
2. Beri nama: produk-images.
3. Set status ke Public.
### 6. Eksekusi Schema & RLS Policy
Buka SQL Editor di Supabase Dashboard, lalu jalankan query SQL berikut:
```SQL
-- TABEL PRODUK
CREATE TABLE produk (
    id_produk VARCHAR(20) PRIMARY KEY,
    nama_produk VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    harga_jual NUMERIC(12,2) NOT NULL DEFAULT 0,
    modal_normal NUMERIC(12,2) NOT NULL DEFAULT 0,
    modal_takeaway NUMERIC(12,2) NOT NULL DEFAULT 0,
    gambar_produk TEXT,
    status_produk VARCHAR(20) DEFAULT 'aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL TRANSAKSI / PENJUALAN
CREATE TABLE penjualan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_penjualan VARCHAR(50) NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    id_produk VARCHAR(20) REFERENCES produk(id_produk),
    nama_produk VARCHAR(100) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    qty_takeaway INT NOT NULL DEFAULT 0,
    harga_jual NUMERIC(12,2) NOT NULL,
    biaya_takeaway NUMERIC(12,2) DEFAULT 500,
    total_penjualan NUMERIC(12,2) NOT NULL,
    total_modal NUMERIC(12,2) NOT NULL,
    laba_kotor NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL PENGELUARAN
CREATE TABLE pengeluaran (
    id_pengeluaran VARCHAR(50) PRIMARY KEY,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    nama_pengeluaran VARCHAR(150) NOT NULL,
    kategori_pengeluaran VARCHAR(100) NOT NULL,
    nominal NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL REKAP HARIAN (RESET AUTOMATION 03:00 WIB)
CREATE TABLE rekap_harian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal_operasional DATE UNIQUE NOT NULL,
    omset NUMERIC(12,2) DEFAULT 0,
    pengeluaran NUMERIC(12,2) DEFAULT 0,
    laba_bersih NUMERIC(12,2) DEFAULT 0,
    jumlah_transaksi INT DEFAULT 0,
    ai_analysis_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SETUP ROW LEVEL SECURITY (RLS)
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE penjualan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE rekap_harian ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access on produk" ON produk FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on penjualan" ON penjualan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on pengeluaran" ON pengeluaran FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on rekap_harian" ON rekap_harian FOR ALL USING (true) WITH CHECK (true);

-- STORAGE BUCKET RLS
CREATE POLICY "Public Read produk-images" ON storage.objects FOR SELECT USING (bucket_id = 'produk-images');
CREATE POLICY "Allow Insert produk-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'produk-images');
CREATE POLICY "Allow Update produk-images" ON storage.objects FOR UPDATE USING (bucket_id = 'produk-images');
CREATE POLICY "Allow Delete produk-images" ON storage.objects FOR DELETE USING (bucket_id = 'produk-images');
```
---
## ☁️ Deploy ke Vercel via CLI
```Bash
# 1. Login Vercel
vercel login

# 2. Deploy Preview
vercel

# 3. Deploy ke Production (Live URL)
vercel --prod
```
Catatan: Jangan lupa tambahkan NEXT_PUBLIC_SUPABASE_URL dan 
NEXT_PUBLIC_SUPABASE_ANON_KEY pada menu Settings → Environment Variables di Dashboard Vercel.

## 📁 Struktur Projectpos_mieayam
```/
├── app/
│   ├── (dashboard)/
│   │   ├── kasir/         # Halaman Kasir (POS Interface)
│   │   ├── menu/          # Manajemen Menu & Produk
│   │   ├── pengaturan/    # Setting Toko & Gemini API Key
│   │   ├── pengeluaran/   # Expense Tracker
│   │   └── rekap/         # Laporan Keuangan, AI Analytics & Export PDF
│   ├── login/             # Halaman Login Multi-Role
│   ├── globals.css        # Custom Tailwind & Global Styles
│   └── layout.tsx         # Root Layout Application
├── components/            # Komponen UI Reusable
├── docs/                  # Asset Gambar Screenshot untuk Dokumentasi README
├── lib/                   # Konfigurasi Client Supabase & Gemini AI
├── PRD.md                 # Product Requirement Document
├── README.md              # Dokumentasi Utama Repository
└── next.config.js         # Configuration Next.js
```
---
<div align="center">
📄 LisensiProject ini dilindungi di bawah lisensi MIT.

Dibuat dengan ❤️ untuk kemajuan UMKM Kuliner Indonesia
Jangan lupa berikan bintang ⭐ pada repositori ini jika bermanfaat!
</div>
