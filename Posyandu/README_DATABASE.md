\# 🗄️ Supabase Database Schema - Posyandu Demalang



This file serves as a context for Cursor AI to understand the database structure of the Posyandu App.



\## Tables \& Schema



\### 1. `anak` (Children Profiles)

\- `id`: UUID (Primary Key, default: gen\_random\_uuid())

\- `user\_id`: UUID (Foreign Key references auth.users(id), cascaded)

\- `nama\_anak`: VARCHAR(255) (Not Null)

\- `tanggal\_lahir`: DATE (Not Null)

\- `jenis\_kelamin`: CHAR(1) (Not Null, CHECK IN ('L', 'P'))

\- `nama\_ibu`: VARCHAR(255) (Not Null)

\- `no\_hp`: VARCHAR(20) (Not Null)

\- `bb\_lahir`: NUMERIC(4,2) (Nullable, in kg)

\- `tb\_lahir`: NUMERIC(4,1) (Nullable, in cm)

\- `created\_at`: TIMESTAMP WITH TIME ZONE (Default: now())



\### 2. `harian\_nutrisi` (Daily AI Nutrition Scans)

\- `id`: UUID (Primary Key, default: gen\_random\_uuid())

\- `anak\_id`: UUID (Foreign Key references anak(id), cascaded)

\- `foto\_url`: TEXT (Nullable)

\- `analisis\_ai`: TEXT (Not Null)

\- `status\_gizi\_hari\_ini`: VARCHAR(50) (Nullable)

\- `tanggal\_scan`: DATE (Default: CURRENT\_DATE)



\### 3. `timbangan\_bulanan` (Monthly Posyandu Records)

\- `id`: UUID (Primary Key, default: gen\_random\_uuid())

\- `anak\_id`: UUID (Foreign Key references anak(id), cascaded)

\- `berat\_badan`: NUMERIC(4,2) (Not Null, in kg)

\- `tinggi\_badan`: NUMERIC(4,1) (Not Null, in cm)

\- `lingkar\_kepala`: NUMERIC(3,1) (Nullable, in cm)

\- `bulan\_ke`: INT (Not Null, child's age in months during measurement)

\- `catatan\_kader`: TEXT (Nullable)

\- `tanggal\_timbang`: DATE (Default: CURRENT\_DATE)



\## Security

\- Row Level Security (RLS) is enabled on table `anak`.

\- Users (Mothers) can only INSERT and SELECT their own child's data based on `auth.uid() = user\_id`.

\- Admin/Kader has bypass or separate logic to view all data for monitoring.

