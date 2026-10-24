const LS_KEY = 'mabourse-config';

function readOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

/** Configuration effective : réglages saisis dans l'app > variables d'environnement. */
export function getConfig() {
  const o = readOverrides();
  return {
    sheetsUrl: o.sheetsUrl ?? import.meta.env.VITE_SHEETS_URL ?? '',
    sheetsToken: o.sheetsToken ?? import.meta.env.VITE_SHEETS_TOKEN ?? '',
    currency: o.currency || import.meta.env.VITE_CURRENCY || 'MAD',
  };
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
