\# PRD: NaskahSakti (All-in-One Administrative \& Public Advocacy Hub)



\## 1. System Overview

Core: Web-based Single Page Application (SPA) to empower community organizations in generating formal documents (proposals, official letters, press releases) using Gemini AI.

Access Control: Dual-View interface toggled via Navbar ("Halaman Warga" \& "Halaman Admin").



\## 2. Hardcoded Database Environment (Supabase)

\- SUPABASE\_URL = "https://zgkufyjodvbtnsjyruur.supabase.co"

\- SUPABASE\_ANON\_KEY = "sb\_publishable\_ChsfCLvoBGCQI4EACyXFKg\_GGrCuA9U"



\### Schema Tables:

1\. `komunitas\_profil` (id, nama\_komunitas, jenis\_komunitas, wilayah\_desa, kontak\_person, created\_at)

2\. `dokumen\_advokasi` (id, komunitas\_id, jenis\_dokumen, judul\_dokumen, input\_mentah, output\_text, created\_at)

3\. `sistem\_konfigurasi` (id='gemini\_config', gemini\_api\_key, updated\_at)



\## 3. Core Features \& Architecture Logic



\### F1: Dynamic Workspace (Halaman Warga)

\- Split-Screen Layout: Left UI controls form inputs, Right UI displays A4 Canvas Preview.

\- Input Fields: Form dynamic based on selected document type ('proposal', 'surat\_audiensi', 'press\_release').

\- Render Mechanism: Use Marked.js to parse Gemini raw Markdown output into HTML inside an A4-styled div (`font-serif text-justify prose`).

\- Output Actions: Top action bar with "Salin Teks" (Clipboard API) and "Cetak/PDF" (`window.print()`).



\### F2: Dynamic Gemini API Key Management (Strict Rule)

\- CRITICAL: DO NOT hardcode the Gemini API Key inside code files.

\- Logic Flow: Before running AI generation, the script MUST perform a Supabase select query to fetch `gemini\_api\_key` from table `sistem\_konfigurasi` where `id='gemini\_config'`.

\- Endpoint: Use the fetched key to POST requests to `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${FETCHED\_API\_KEY}`

\- Payload Constraints: Temperature: 0.1. System Instruction: "Role: Expert Indonesian public admin \& PR NGO. Rule: Output raw Markdown only from line 1. No conversational intro/outro filler."



\### F3: Administration \& Analytics Panel (Halaman Admin)

\- Section A (API Config): Simple input form and "Simpan Kunci" button. Triggers a Supabase UPDATE statement to update `gemini\_api\_key` inside `sistem\_konfigurasi`.

\- Section B (Document Recap): Table displaying ALL generated logs from `dokumen\_advokasi` joined with `komunitas\_profil`. Columns: Date, Organization, Doc Type, Title, and a "Lihat" button to load historical text back into the A4 Canvas view.

