Project Name: MajuLokal (AI Business Launchpad untuk UMKM)



Architecture: Single Page Application (SPA) - Vanilla JS, Tailwind CSS, Supabase, Gemini API

1\. Project Background \& Credentials

MajuLokal adalah sebuah platform web satu halaman yang memfasilitasi korban PHK atau masyarakat umum yang ingin membuka usaha mikro. Aplikasi harus menerima input bahasa sehari-hari/informal dan mengubahnya menjadi output bisnis yang profesional serta konten pemasaran multisaluran secara otomatis menggunakan memori database.

Technical Credentials

Supabase Project URL: \[https://zcwbeltilwdvusqcpibz.supabase.co](https://zcwbeltilwdvusqcpibz.supabase.co)

Supabase Anon API Key: sb\_publishable\_Mm5PnTvDywYJ9LP1Al4N-Q\_WGHqgrAp

Gemini API Endpoint: \[https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$){apiKey}

Gemini API Key Source: Diambil secara dinamis dari database/LocalStorage (diinput via Menu 3/Halaman Admin).

2\. Database Schema (Supabase)
A. Table: users\_bisnis (Master Data)
id (BIGINT, Primary Key, Identity)
nama\_user (VARCHAR)
kondisi\_lingkungan (TEXT)
modal\_awal (NUMERIC)
ide\_bisnis\_terpilih (VARCHAR)
roadmap\_4\_minggu (JSONB)
created\_at (TIMESTAMPTZ, default: now())

B. Table: promosi\_harian (Transaction Data)
id (BIGINT, Primary Key, Identity)
user\_id (BIGINT, Foreign Key references users\_bisnis(id) ON DELETE CASCADE)
perintah\_harian (TEXT)
promosi\_whatsapp (TEXT)
promosi\_instagram (TEXT)
promosi\_facebook (TEXT)
promosi\_tiktok (TEXT)
created\_at (TIMESTAMPTZ, default: now())

3\. Core Features \& App Flow (SPA View Management)
Aplikasi dikelola menggunakan sistem navigasi berbasis state view (sembunyi/munculkan seksi komponen tanpa reload halaman).

MENU 1: FASE 1 (Inkubasi Bisnis)
Form Input: Nama User, Kondisi Lingkungan (Bahasa santai), dan Nominal Modal.
AI Engine Request: Menghasilkan 3 Opsi Ide Bisnis Profesional beserta rencana aksi (roadmap) 4 minggu terstruktur untuk masing-masing opsi.
User Action:
Jika suka salah satu opsi, klik "Pilih & Ambil Ide Ini" -> Data profil BESERTA objek data roadmap_4_minggu opsi terpilih langsung disimpan ke users_bisnis. Setelah sukses, view otomatis berpindah/aktif ke Menu 2.
Jika tidak suka, klik "Cari Ide Lain (Regenerate)" -> Menembak API Gemini kembali untuk mencari alternatif baru.

MENU 2: FASE 2 (Daily Content Generator)
Context Fetching: Dropdown atau kolom pencarian nama profil user yang mengambil data langsung dari tabel users\_bisnis. Begitu nama dipilih, sistem menyimpan data ide\_bisnis\_terpilih di dalam memori variabel.
Roadmap Display Widget:
Tepat di atas form input AI harian, buat sebuah komponen visual widget bernama "Rencana Aksi 4 Minggu Anda".
Begitu data user di-fetch, baca kolom roadmap_4_minggu (JSONB), lalu render datanya ke dalam 4 kotak/grid horizontal (Minggu 1, Minggu 2, Minggu 3, Minggu 4) agar user bisa melihat progres bisnis mereka.
Input Promo: Kotak teks perintah harian pendek (misal: "diskon jumat berkah beli 2 gratis 1").
Context-Aware Processing: JavaScript menggabungkan secara otomatis: Profil Bisnis dari DB + Perintah Harian User.
Multichannel Output: Menghasilkan 4 tab variasi konten pemasaran sekaligus:
WhatsApp Status (Personal \& akrab)
Instagram Post (Estetik + Hashtag)
Facebook Group (Storytelling warga)
TikTok Post (Hook pendek memikat + Rekomendasi visual ide video)
Storage: Hasil komplit otomatis masuk ke tabel promosi\_harian.

MENU 3: HALAMAN ADMIN (Configuration \& Analytics)
Credential Manager: Form input untuk memasukkan Gemini API Key secara dinamis. Kunci disimpan dengan aman di LocalStorage aplikasi atau tabel konfigurasi terpisah agar tidak hardcoded di skrip.
User Monitoring Table: Menampilkan seluruh data pengguna yang telah mendaftar dari tabel users\_bisnis (Nama, Modal, Lingkungan, Ide Terpilih) beserta opsi untuk melihat total promosi yang sudah mereka buat.

4\. UI/UX Design Goals (Human-Centric \& Responsive)
Anti-AI Aesthetic: Hindari palet warna gradasi ungu-biru neon futuristik ala cyberpunk generik buatan AI. Gunakan pendekatan desain lokal, bersih, ramah, bersahabat, dan profesional menggunakan Tailwind CSS (misal: aksen hijau bumi daun/emerald hangat #0f766e kombinasikan dengan latar putih gading/slate bersih).
Typography \& Micro-interactions: Manfaatkan kontras teks yang tajam, sudut kartu yang membulat halus (rounded-xl), serta transisi mikro pada tombol saat diarahkan kursor (hover effect).
Responsive Layout: Desain wajib bertransformasi secara anggun di perangkat seluler (Mobile-first layout) mengingat target pengguna adalah pelaku UMKM yang dominan mengakses aplikasi lewat smartphone.