// ─────────────────────────────────────────────────────────────────────────────
// supabase.js  —  All Supabase REST API interactions for MajuLokal
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';

// ── Internal fetch wrapper ────────────────────────────────────────────────────
/**
 * Low-level fetch wrapper for Supabase REST calls.
 * @param {string} path    - Supabase REST path, e.g. '/users_bisnis?select=*'
 * @param {string} method  - HTTP verb
 * @param {object|null} body - JSON payload for POST/PATCH
 * @returns {Promise<object|null>}
 */
async function _sbFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: CONFIG.supabase.headers,
  };
  if (body) {
    opts.body = JSON.stringify(body);
  }

  console.debug(`[Supabase] ${method} ${CONFIG.supabase.url + path}`);

  const response = await fetch(CONFIG.supabase.url + path, opts);

  // 204 No Content — normal for DELETEs
  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Supabase] Request failed:', response.status, errorText);
    throw new Error(`Supabase ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.debug('[Supabase] Response:', data);
  return data;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch user profiles from users_bisnis.
 * Accepts an optional query string (without leading '?').
 * @param {string} [query] - e.g. 'select=id,nama_user&order=created_at.desc'
 * @returns {Promise<Array>}
 */
export async function fetchUsers(query = 'select=*&order=created_at.desc') {
  try {
    const data = await _sbFetch(`/users_bisnis?${query}`);
    return data ?? [];
  } catch (err) {
    console.error('[Supabase] fetchUsers failed:', err);
    throw err;
  }
}

/**
 * Fetch a single user by id from users_bisnis.
 * @param {string|number} id
 * @returns {Promise<object>}
 */
export async function fetchUserById(id) {
  try {
    const data = await _sbFetch(`/users_bisnis?id=eq.${id}&limit=1`);
    if (!data || data.length === 0) {
      throw new Error('Profil pengguna tidak ditemukan di database.');
    }
    console.debug('[Supabase] fetchUserById result:', data[0]);
    return data[0];
  } catch (err) {
    console.error('[Supabase] fetchUserById failed:', err);
    throw err;
  }
}

/**
 * Insert a new business profile into users_bisnis.
 * @param {object} data - { nama_user, kondisi_lingkungan, modal_awal, ide_bisnis_terpilih, roadmap_4_minggu }
 * @returns {Promise<object>} The inserted row.
 */
export async function saveUserBusiness(data) {
  try {
    console.debug('[Supabase] saveUserBusiness payload:', data);
    const result = await _sbFetch('/users_bisnis', 'POST', data);
    // Supabase returns an array with Prefer: return=representation
    const row = Array.isArray(result) ? result[0] : result;
    console.debug('[Supabase] saveUserBusiness saved row:', row);
    return row;
  } catch (err) {
    console.error('[Supabase] saveUserBusiness failed:', err);
    throw err;
  }
}

/**
 * Insert a new daily promo record into promosi_harian.
 * @param {object} data - { user_id, perintah_harian, promosi_whatsapp, promosi_instagram, promosi_facebook, promosi_tiktok }
 * @returns {Promise<object>} The inserted row.
 */
export async function saveDailyPromo(data) {
  try {
    const safeData = {
      ...data,
      promosi_instagram: typeof data.promosi_instagram === 'object' ? JSON.stringify(data.promosi_instagram) : data.promosi_instagram,
      promosi_facebook: typeof data.promosi_facebook === 'object' ? JSON.stringify(data.promosi_facebook) : data.promosi_facebook,
      promosi_tiktok: typeof data.promosi_tiktok === 'object' ? JSON.stringify(data.promosi_tiktok) : data.promosi_tiktok,
    };

    console.debug('[Supabase] saveDailyPromo payload:', safeData);
    const result = await _sbFetch('/promosi_harian', 'POST', safeData);
    const row = Array.isArray(result) ? result[0] : result;
    console.debug('[Supabase] saveDailyPromo saved row:', row);
    return row;
  } catch (err) {
    console.error('[Supabase] saveDailyPromo failed:', err);
    throw err;
  }
}

/**
 * Fetch all promo records (only user_id column) to compute per-user counts.
 * @returns {Promise<Array>}
 */
export async function fetchPromoUserIds() {
  try {
    const data = await _sbFetch('/promosi_harian?select=user_id');
    return data ?? [];
  } catch (err) {
    console.error('[Supabase] fetchPromoUserIds failed:', err);
    // Non-fatal — admin table still shows user data without counts
    return [];
  }
}

/**
 * Verify admin login credentials against the database.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function verifyAdminLogin(username, password) {
  try {
    const data = await _sbFetch(`/admin_accounts?username=eq.${encodeURIComponent(username)}&limit=1`);
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
