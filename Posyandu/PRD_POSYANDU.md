Product Requirement Document (PRD)

&#x20;Proyek: Aplikasi SPA Posyandu Anak Digital (Desa Demalang) - FASE 1



&#x20;1. Ringkasan Produk (Product Overview)

Aplikasi ini adalah Single Page Application (SPA) berbasis web yang dirancang untuk mendigitalisasi pencatatan data anak di Posyandu Desa Demalang. Sistem ini membagi tampilan menjadi dua sisi secara dinamis dalam satu halaman: Sisi User (Ibu/Orang Tua) untuk registrasi profil anak, dan Sisi Admin (Kader/Bidan) untuk memantau rekap data anak yang telah terdaftar.



&#x20;2. Tujuan Fase 1 (Phase 1 Objectives)

\- Mengimplementasikan alur pendaftaran profil anak (User Side) ke database Supabase.

\- Mengimplementasikan dashboard pemantauan real-time (Admin Side) untuk membaca data dari Supabase.

\- Memastikan kalkulasi umur anak dalam satuan bulan berjalan akurat dan dinamis.

\- Menggunakan skema basis data yang sinkron dengan berkas panduan database.



&#x20;3. Alur Pengguna \& Fitur Teknis (User Flow \& Technical Features)



&#x20;A. Sisi User: Form Registrasi Profil Anak

\- Komponen UI: Elemen form dengan ID `#form-registrasi`.

\- Kebutuhan Data Input:

&#x20; - Nama Lengkap Anak (`#reg-nama-anak`) -> String

&#x20; - Tanggal Lahir (`#reg-tgl-lahir`) -> Date (YYYY-MM-DD)

&#x20; - Jenis Kelamin (`#reg-jk`) -> Enum / Dropdown ('L' / 'P')

&#x20; - Nama Ibu Kandung (`#reg-nama-ibu`) -> String

&#x20; - No. WhatsApp Aktif (`#reg-nohp`) -> String/Telp

&#x20; - Berat Badan Lahir (`#reg-bb`) -> Numeric/Float (kg)

&#x20; - Tinggi Badan Lahir (`#reg-tb`) -> Numeric/Float (cm)

\- Logika Sistem (JavaScript \& Supabase):

&#x20; - Bypass Auth (Tahap Demo): Karena sistem login belum diaktifkan, sistem harus menyuntikkan nilai `user\_id` dummy berformat UUID (misal: `00000000-0000-0000-0000-000000000000`) ke dalam query agar tidak melanggar constraint Foreign Key pada tabel `anak`.

&#x20; - Proses Submit: Menggunakan `try-catch` dengan `async/await` untuk melakukan perintah `INSERT` ke tabel `anak`.

&#x20; - Post-Submit Action: Jika sukses, tampilkan notifikasi alert keberhasilan, kosongkan seluruh input form, lalu panggil fungsi `switchView('view-admin')` untuk langsung memindahkan halaman ke dashboard admin.



&#x20;B. Sisi Admin: Dashboard Monitoring Kader Posyandu

\- Komponen UI: Elemen kontainer dengan ID `#view-admin` dan target render tabel di `#tabel-anak-admin`.

\- Logika Sistem (JavaScript \& Supabase):

&#x20; - Proses Fetch Data: Saat halaman admin dibuka atau tombol Refresh diklik, jalankan query `SELECT  FROM anak` dengan pengurutan berdasarkan `created\_at` secara descending (data terbaru di atas).

&#x20; - Kalkulasi Umur Dinamis: Kolom tanggal lahir harus diolah menggunakan fungsi `hitungUmurBulan()` yang sudah tersedia di dalam kode untuk menghasilkan teks umur dalam bulan (Contoh format: 15 Jan 2025 (17 Bulan)).

&#x20; - Render Kondisional:

&#x20;   - Jika data berhasil ditarik, looping data dan render ke dalam tag `<tr>` sesuai kolom tabel HTML yang tersedia.

&#x20;   - Jika data di tabel Supabase masih kosong, tampilkan baris keterangan tunggal ("Belum ada anak yang terdaftar").

&#x20;   - Jika proses gagal/error, log pesan error ke console dan berikan fallback UI yang aman agar aplikasi tidak crash.



4\. Metrik Keberhasilan Fase 1 (Success Criteria)

1\. Data yang diinputkan melalui form di web masuk secara utuh ke tabel `anak` di dashboard Supabase.

2\. Saat form berhasil dikirim, halaman langsung berpindah ke mode admin secara otomatis (SPA behavior).

3\. Halaman admin menampilkan baris data anak yang baru saja diinput secara real-time tanpa perlu me-refresh browser.

4\. Perhitungan umur anak akurat hingga hitungan bulan berdasarkan tanggal saat ini.


5\. Fitur Unggulan: AI Scan Gizi Real-time (Vision Food Guard)

\- Komponen UI: Elemen input kamera (`#foto-makanan`) dan tombol `#btn-scan-gizi`.

\- Validasi Ketat: 

&#x20; - System prompt Gemini AI diprogram secara ketat untuk mendeteksi keberadaan makanan/minuman pada gambar.

&#x20; - Jika objek di foto terbukti BUKAN makanan/minuman, AI wajib mengembalikan format respon gagal secara terstandar.

&#x20; - Aplikasi web akan langsung menampilkan pesan penolakan ("Objek tidak dikenali sebagai makanan!"), menghentikan proses, dan tidak menyimpan data sampah ke Supabase.

