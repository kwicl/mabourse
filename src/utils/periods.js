import { todayISO } from './format';

/** Périodes du sélecteur global du tableau de bord. */
export const PERIODS = [
  { key: 'week', label: 'Semaine', vs: 'vs semaine dernière' },
  { key: 'month', label: 'Ce mois', vs: 'vs mois dernier' },
  { key: 'lastMonth', label: 'Mois dernier', vs: 'vs mois précédent' },
  { key: '3m', label: '3 mois', vs: 'vs 3 mois précédents', months: 3 },
  { key: '6m', label: '6 mois', vs: 'vs 6 mois précédents', months: 6 },
  { key: '12m', label: '12 mois', vs: 'vs 12 mois précédents', months: 12 },
  { key: 'all', label: 'Tout', vs: null },
  { key: 'custom', label: 'Personnalisé', vs: 'vs période précédente' },
];

/** Libellé d'une plage : « 3 oct. → 24 oct. 2026 ». */
export function rangeLabel(fromISO, toISO) {
  const f = new Date(`${fromISO}T12:00:00`);
  const t = new Date(`${toISO}T12:00:00`);
  const sameYear = f.getFullYear() === t.getFullYear();
  const fmt = (d, year) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: year ? 'numeric' : undefined });
  return `${fmt(f, !sameYear)} → ${fmt(t, true)}`;
}

// Dates manipulées à midi pour éviter les décalages de fuseau
const at = (iso) => new Date(`${iso}T12:00:00`);
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const firstOfMonth = (d, shift = 0) => new Date(d.getFullYear(), d.getMonth() + shift, 1, 12);
const lastOfMonth = (d, shift = 0) => new Date(d.getFullYear(), d.getMonth() + shift + 1, 0, 12);
const addMonths = (d, n) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};

/**
 * Bornes ISO incluses de la période et de la période précédente (comparaison des tendances).
 * Renvoie { from, to, prevFrom, prevTo } ; prevFrom/prevTo valent null pour "Tout".
 * `custom` = { from, to } pour la période personnalisée (comparée à la même durée juste avant).
 */
export function periodRange(key, transactions = [], custom = null) {
  const today = at(todayISO());
  switch (key) {
    case 'custom': {
      if (!custom?.from || !custom?.to) return periodRange('month', transactions);
      const [from, to] = custom.from <= custom.to ? [custom.from, custom.to] : [custom.to, custom.from];
      const days = Math.round((at(to) - at(from)) / 86400000) + 1;
      return {
        from,
        to,
        prevFrom: iso(addDays(at(from), -days)),
        prevTo: iso(addDays(at(from), -1)),
      };
    }
    case 'week': {
      // Semaine en cours : lundi → aujourd'hui, comparée à la semaine précédente complète (lun → dim)
      const monday = addDays(today, -((today.getDay() + 6) % 7));
      return {
        from: iso(monday),
        to: iso(today),
        prevFrom: iso(addDays(monday, -7)),
        prevTo: iso(addDays(monday, -1)),
      };
    }
    case 'lastMonth':
      return {
        from: iso(firstOfMonth(today, -1)),
        to: iso(lastOfMonth(today, -1)),
        prevFrom: iso(firstOfMonth(today, -2)),
        prevTo: iso(lastOfMonth(today, -2)),
      };
    case '3m':
    case '6m':
    case '12m': {
      const n = PERIODS.find((p) => p.key === key).months;
      const from = addDays(addMonths(today, -n), 1);
      return {
        from: iso(from),
        to: iso(today),
        prevFrom: iso(addDays(addMonths(from, -n), 0)),
        prevTo: iso(addDays(from, -1)),
      };
    }
    case 'all': {
      const first = transactions.reduce((m, t) => (t.date && t.date < m ? t.date : m), iso(today));
      return { from: first, to: iso(today), prevFrom: null, prevTo: null };
    }
    case 'month':
    default:
      return {
        from: iso(firstOfMonth(today)),
        to: iso(today),
        prevFrom: iso(firstOfMonth(today, -1)),
        prevTo: iso(lastOfMonth(today, -1)),
      };
  }
}
