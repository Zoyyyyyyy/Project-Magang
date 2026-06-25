MajuLokal - AI Business Launchpad untuk UMKM

MajuLokal adalah aplikasi web satu halaman (Single Page Application) pintar yang membantu masyarakat awam membangun fondasi bisnis mikro, memonitor rencana aksi bisnis, dan mengelola konten promosi harian secara mandiri melalui bantuan kecerdasan buatan (Gemini API) dan manajemen database (Supabase).

Tech Stack & Integrations
- Frontend Framework: Vanilla JavaScript (ES6+ Modules)
- Styling Engine: Tailwind CSS via CDN
- Database Backend: Supabase (PostgreSQL Restful API)
- AI Core: Gemini 2.5 Flash Engine

File Blueprint
- `index.html` (Memuat elemen struktur HTML5, utilitas Tailwind CSS, dan komponen tampilan SPA).

Updated Data Flow Model
1. Fase Pendaftaran: User Input -> Gemini NLU Processing -> 3 Opsi Bisnis + Roadmap -> User Select -> Saved Profile & Roadmap (JSONB) to Supabase (`users_bisnis`).
2. Fase Pemasaran: User Select Profile via Dropdown -> Fetch Business Data & Roadmap from DB -> Render Roadmap 4 Minggu di Atas Form AI -> Input Prompt Harian -> Gemini Generation -> 4 Channels Content -> Saved to Supabase (`promosi_harian`).
3. Fase Admin:Input Gemini Key to LocalStorage -> Read Database (`users_bisnis`) -> Populate Admin Table.