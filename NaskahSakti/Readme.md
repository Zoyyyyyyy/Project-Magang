\# NaskahSakti - Platform Advokasi \& Administrasi Warga



Aplikasi web berbasis Single Page Application (SPA) yang memfasilitasi pembuatan dokumen legal/formal tingkat desa secara otomatis menggunakan Gemini AI terintegrasi Supabase Database.



\## 🛠️ Tech Stack \& Dependencies

\- Frontend: HTML5, Tailwind CSS CDN, Tailwind Typography Plugin CDN.

\- Markdown Processor: Marked.js CDN.

\- Backend/Database: Supabase Client JS CDN.

\- AI Engine: Google Gemini API (Fetched dynamically via DB config).



\## 🔌 Integration Workflow

1\. \*\*Inisialisasi Aplikasi:\*\*

&#x20;  Script memuat library Supabase menggunakan URL dan Kunci Anonim yang sudah tertera di PRD Bagian 2.

2\. \*\*Pengambilan API Key:\*\*

&#x20;  Sistem membaca baris `gemini\_config` dari tabel `sistem\_konfigurasi`. Jika nilainya masih 'KOSONG', Halaman Warga menampilkan peringatan agar Admin mengisi API Key terlebih dahulu.

3\. \*\*Eksekusi AI:\*\*

&#x20;  Input mentah dari form warga dikirim ke endpoint Gemini menggunakan kunci yang didapat dari database. Hasil respon langsung diparsing oleh `marked.js` ke elemen `#a4-preview-canvas` dan disimpan ke log database `dokumen\_advokasi`.

4\. \*\*Manajemen Admin:\*\*

&#x20;  Admin memperbarui API Key langsung melalui antarmuka web, mengeliminasi kebutuhan ubah kode (\*hardcoding\*) saat deploy ulang.



\## 🖥️ UI Layout Guideline

\- Gunakan skema warna profesional yang bersih (Slate/Zinc dengan aksen Emerald untuk tombol aksi utama).

\- Pastikan layout cetak A4 menggunakan rasio aslinya (`w-\[210mm] min-h-\[297mm]`) dan tidak berantakan saat dicetak di printer fisik.

