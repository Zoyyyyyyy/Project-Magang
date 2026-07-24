// ─────────────────────────────────────────────────────────────────────────────
// config.js  —  MajuLokal centralised configuration
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  supabase: {
    url: 'https://ksbjkgcorfmdabneaoyl.supabase.co',
    anonKey: 'sb_publishable_tmLlHYk3ywF88hshkd9Bfg_y6IzYxN_',
    get headers() {
      return {
        apikey: this.anonKey,
        Authorization: 'Bearer ' + this.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      };
    },
  },

  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
    localStorageKey: 'gemini_api_key',
  },
};
