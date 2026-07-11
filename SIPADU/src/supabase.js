/* ============================================================
 * supabase.js — Posyandu Demalang
 * Konfigurasi dan inisialisasi Supabase client
 * ============================================================ */

const SUPABASE_URL = 'https://ordqbnaeiovvthusjzpx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q8Y9pqQ8RDxHlf374sxlSw_LxXuqYFw';
const DUMMY_UUID = '00000000-0000-0000-0000-000000000000';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
