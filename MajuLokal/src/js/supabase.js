// ─────────────────────────────────────────────────────────────────────────────
// supabase.js  —  All Supabase API interactions for MajuLokal
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL      = 'https://ksbjkgcorfmdabneaoyl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYmprZ2NvcmZtZGFibmVhb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2OTE3MDksImV4cCI6MjEwMDI2NzcwOX0.dr3vFaKL__LE_zZx4g7tQTe5lj7yuhksojTbWVul28I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchUsers(query = 'select=*&order=created_at.desc') {
  try {
    let selectFields = '*';
    if (query.includes('select=id,nama_user,ide_bisnis_terpilih')) {
      selectFields = 'id,nama_user,ide_bisnis_terpilih';
    }
    
    const { data, error } = await supabase
      .from('users_bisnis')
      .select(selectFields)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('[Supabase] fetchUsers failed:', err);
    throw err;
  }
}

export async function fetchUserById(id) {
  try {
    const { data, error } = await supabase
      .from('users_bisnis')
      .select('*')
      .eq('id', id)
      .limit(1);
      
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Profil pengguna tidak ditemukan di database.');
    }
    return data[0];
  } catch (err) {
    console.error('[Supabase] fetchUserById failed:', err);
    throw err;
  }
}

export async function saveUserBusiness(data) {
  try {
    const { data: result, error } = await supabase
      .from('users_bisnis')
      .insert([data])
      .select();
      
    if (error) throw error;
    return Array.isArray(result) ? result[0] : result;
  } catch (err) {
    console.error('[Supabase] saveUserBusiness failed:', err);
    throw err;
  }
}

export async function saveDailyPromo(data) {
  try {
    const safeData = {
      ...data,
      promosi_instagram: typeof data.promosi_instagram === 'object' ? JSON.stringify(data.promosi_instagram) : data.promosi_instagram,
      promosi_facebook: typeof data.promosi_facebook === 'object' ? JSON.stringify(data.promosi_facebook) : data.promosi_facebook,
      promosi_tiktok: typeof data.promosi_tiktok === 'object' ? JSON.stringify(data.promosi_tiktok) : data.promosi_tiktok,
    };

    const { data: result, error } = await supabase
      .from('promosi_harian')
      .insert([safeData])
      .select();
      
    if (error) throw error;
    return Array.isArray(result) ? result[0] : result;
  } catch (err) {
    console.error('[Supabase] saveDailyPromo failed:', err);
    throw err;
  }
}

export async function fetchPromoUserIds() {
  try {
    const { data, error } = await supabase
      .from('promosi_harian')
      .select('user_id');
      
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('[Supabase] fetchPromoUserIds failed:', err);
    return [];
  }
}

export async function verifyAdminLogin(username, password) {
  try {
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('*')
      .eq('username', username)
      .limit(1);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      if (data[0].password_plain === password) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('[Supabase] verifyAdminLogin failed:', err);
    return false;
  }
}
