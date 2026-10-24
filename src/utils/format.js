import { getConfig } from '../config';

let cached = null;
function formatter() {
  const currency = getConfig().currency;
  if (!cached || cached.currency !== currency) {
    cached = {
      currency,
      // Un chiffre après la virgule
      full: new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      compact: new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }),
    };
  }
  return cached;
}

export const money = (v) => formatter().full.format(v || 0);

/** Montant découpé : { number: '327 773,0', currency: 'MAD' } pour styler la devise à part. */
export function moneyParts(v) {
  const parts = formatter().full.formatToParts(v || 0);
  return {
    number: parts.filter((p) => p.type !== 'currency').map((p) => p.value).join('').trim(),
    currency: parts.find((p) => p.type === 'currency')?.value ?? '',
  };
}
export const compact = (v) => formatter().compact.format(v || 0);
export const signedMoney = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + money(Math.abs(v));

export const pct = (v) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)} %`;

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const monthKey = (iso) => String(iso).slice(0, 7);

export function monthLabel(key, style = 'short') {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: style, year: style === 'long' ? 'numeric' : undefined });
}

export function dayLabel(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function relativeDayLabel(iso) {
  const today = todayISO();
  const y = new Date(`${today}T12:00:00`);
  y.setDate(y.getDate() - 1);
  if (iso === today) return "Aujourd'hui";
  if (iso === y.toISOString().slice(0, 10)) return 'Hier';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
