const LS_KEY = 'mabourse-config';

function readOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * Configuration effective : réglages saisis dans l'app > variables d'environnement.
 * proxyUrl : fonction serverless Vercel (api/sheets.js) utilisée en production quand aucune URL directe n'est fournie.
 */
export function getConfig() {
  const o = readOverrides();
  return {
    sheetsUrl: o.sheetsUrl ?? import.meta.env.VITE_SHEETS_URL ?? '',
    sheetsToken: o.sheetsToken ?? import.meta.env.VITE_SHEETS_TOKEN ?? '',
    proxyUrl: import.meta.env.VITE_API_PROXY ?? (import.meta.env.PROD ? '/api/sheets' : ''),
    currency: o.currency || import.meta.env.VITE_CURRENCY || 'MAD',
  };
}

// Mot de passe du gardien, gardé uniquement sur cet appareil
const PASS_KEY = 'mabourse-pass';

export function getPassword() {
  try {
    return localStorage.getItem(PASS_KEY) || '';
  } catch {
    return '';
  }
}

export function setPassword(value) {
  try {
    if (value) localStorage.setItem(PASS_KEY, value);
    else localStorage.removeItem(PASS_KEY);
  } catch {
    /* stockage indisponible */
  }
}

export function saveConfig(patch) {
  const next = { ...readOverrides(), ...patch };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
  return getConfig();
}
