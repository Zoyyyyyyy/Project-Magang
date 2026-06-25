// ─────────────────────────────────────────────────────────────────────────────
// config.js  —  MajuLokal centralised configuration
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  supabase: {
    url:     'https://zcwbeltilwdvusqcpibz.supabase.co/rest/v1',
    anonKey: 'sb_publishable_Mm5PnTvDywYJ9LP1Al4N-Q_WGHqgrAp',
    get headers() {
      return {
        apikey:        this.anonKey,
        Authorization: 'Bearer ' + this.anonKey,
        'Content-Type':  'application/json',
        Prefer:        'return=representation',
      };
    },
  },

  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    localStorageKey: 'gemini_api_key',
  },
};
