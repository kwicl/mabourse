/**
 * Patrimoine : immobilier, bourse et or (feuille Assets) + historique des valeurs (feuille Valuations).
 *
 * Une ligne Assets, selon `kind` :
 *  - property : quantity = surface (m²), cost = prix d'achat total (frais compris), price = valeur
 *               estimée actuelle, loan = capital restant dû, rent = loyer mensuel,
 *               charges = charges mensuelles (mensualité de crédit, syndic, taxes…), location = ville.
 *  - stock    : symbol = ticker, quantity = nombre de titres, cost = prix de revient unitaire (PRU),
 *               price = dernier cours.
 *  - gold     : symbol = carats (24, 22, 21, 18), quantity = grammes, cost = prix d'achat au gramme,
 *               price = valeur actuelle au gramme.
 */
import { todayISO } from './format';

export const KINDS = {
  property: {
    label: 'Immobilier',
    short: 'Immo',
    subtypes: [
      { id: 'appartement', label: 'Appartement' },
      { id: 'villa', label: 'Villa' },
      { id: 'maison', label: 'Maison / Riad' },
      { id: 'terrain', label: 'Terrain' },
      { id: 'commerce', label: 'Local commercial' },
      { id: 'bureau', label: 'Bureau' },
    ],
  },
  stock: {
    label: 'Bourse',
    short: 'Bourse',
    subtypes: [
      { id: 'action', label: 'Action' },
      { id: 'etf', label: 'ETF' },
      { id: 'opcvm', label: 'OPCVM / Fonds' },
      { id: 'obligation', label: 'Obligation' },
    ],
  },
  gold: {
    label: 'Or',
    short: 'Or',
    subtypes: [
      { id: 'lingot', label: 'Lingot' },
      { id: 'piece', label: 'Pièce' },
      { id: 'bijou', label: 'Bijoux' },
    ],
  },
};

export const CARATS = [24, 22, 21, 18];
export const subtypeLabel = (a) => KINDS[a.kind]?.subtypes.find((s) => s.id === a.subtype)?.label ?? KINDS[a.kind]?.label ?? '';

const n = (v) => Number(v) || 0;

export const valueOf = (a) => (a.kind === 'property' ? n(a.price) : n(a.quantity) * n(a.price));
export const investedOf = (a) => (a.kind === 'property' ? n(a.cost) : n(a.quantity) * n(a.cost));
export const debtOf = (a) => (a.kind === 'property' ? n(a.loan) : 0);
export const equityOf = (a) => valueOf(a) - debtOf(a);
export const gainOf = (a) => valueOf(a) - investedOf(a);
export const gainPct = (a) => (investedOf(a) ? gainOf(a) / investedOf(a) : 0);

/** Rendements locatifs (sur le prix d'achat) et cash-flow mensuel. */
export function propertyStats(a) {
  const cost = n(a.cost);
  const rent = n(a.rent);
  const charges = n(a.charges);
  const value = valueOf(a);
  return {
    grossYield: cost ? (rent * 12) / cost : 0,
    netYield: cost ? ((rent - charges) * 12) / cost : 0,
    cashflow: rent - charges,
    perM2: n(a.quantity) ? value / n(a.quantity) : 0,
    ownedShare: value ? Math.max(0, Math.min(1, (value - n(a.loan)) / value)) : 0,
  };
}

/** Totaux du patrimoine. `liquidity` = solde des comptes (trésorerie). */
export function wealthTotals(assets, liquidity = 0) {
  const t = { property: 0, stock: 0, gold: 0, debt: 0, invested: 0, rent: 0, charges: 0, rentedCost: 0, rentedCharges: 0 };
  for (const a of assets) {
    if (!KINDS[a.kind]) continue;
    t[a.kind] += valueOf(a);
    t.debt += debtOf(a);
    t.invested += investedOf(a);
    if (a.kind === 'property') {
      t.rent += n(a.rent);
      t.charges += n(a.charges);
      // Rendement : seulement les biens loués (une résidence principale ne rapporte pas de loyer)
      if (n(a.rent) > 0) {
        t.rentedCost += n(a.cost);
        t.rentedCharges += n(a.charges);
      }
    }
  }
  const assetsValue = t.property + t.stock + t.gold;
  const gross = assetsValue + Math.max(0, liquidity);
  return {
    ...t,
    liquidity,
    assetsValue,
    gross,
    net: gross - t.debt,
    gain: assetsValue - t.invested,
    gainPct: t.invested ? (assetsValue - t.invested) / t.invested : 0,
    ltv: t.property ? t.debt / t.property : 0,
    netYield: t.rentedCost ? ((t.rent - t.rentedCharges) * 12) / t.rentedCost : 0,
  };
}

/** id de la valeur du jour : une seule ligne par actif et par jour (réécrite si on remet à jour). */
export const valuationOf = (asset, date = todayISO()) => ({
  id: `${asset.id}-${date}`,
  assetId: asset.id,
  date,
  value: Math.round(valueOf(asset) * 100) / 100,
});

/**
 * Historique par classe : pour chaque date connue, dernière valeur de chaque actif à cette date
 * (0 avant sa première valeur), plus aujourd'hui avec les valeurs actuelles.
 */
export function wealthHistory(assets, valuations) {
  const byId = new Map(assets.map((a) => [a.id, a]));
  const rows = valuations.filter((v) => byId.has(v.assetId) && v.date).sort((a, b) => (a.date < b.date ? -1 : 1));
  const today = todayISO();
  const dates = [...new Set([...rows.map((v) => String(v.date).slice(0, 10)), today])].sort();
  const last = new Map();
  let i = 0;
  return dates.map((date) => {
    while (i < rows.length && String(rows[i].date).slice(0, 10) <= date) {
      last.set(rows[i].assetId, n(rows[i].value));
      i++;
    }
    const point = { date, property: 0, stock: 0, gold: 0 };
    for (const a of assets) {
      if (!KINDS[a.kind]) continue;
      const v = date === today ? valueOf(a) : last.get(a.id);
      if (v) point[a.kind] += v;
    }
    point.total = point.property + point.stock + point.gold;
    return point;
  });
}

/** Valeurs passées d'un actif (mini-courbe). */
export function assetHistory(asset, valuations) {
  const pts = valuations
    .filter((v) => v.assetId === asset.id)
    .map((v) => ({ date: String(v.date).slice(0, 10), value: n(v.value) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const today = todayISO();
  if (!pts.length || pts[pts.length - 1].date !== today) pts.push({ date: today, value: valueOf(asset) });
  return pts;
}

/* ---------- Cours de l'or en direct ---------- */

const OZ = 31.1034768; // grammes par once troy
const GOLD_CACHE = 'mabourse-gold-spot';
const GOLD_TTL = 30 * 60 * 1000;

/**
 * Cours de l'or au gramme (24 carats) dans la devise de l'app.
 * Sources gratuites sans clé : api.gold-api.com (once en USD) + open.er-api.com (change USD → devise).
 * Mis en cache 30 min ; renvoie le dernier cours connu si le réseau échoue.
 */
export async function fetchGoldSpot(currency, force = false) {
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(GOLD_CACHE) || 'null');
  } catch {
    /* ignore */
  }
  if (!force && cached && cached.currency === currency && Date.now() - cached.at < GOLD_TTL) return cached;
  try {
    const [gold, fx] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU').then((r) => r.json()),
      currency === 'USD' ? Promise.resolve({ rates: { USD: 1 } }) : fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()),
    ]);
    const rate = fx?.rates?.[currency];
    if (!gold?.price || !rate) throw new Error('Cours indisponible');
    const spot = {
      currency,
      usdOz: gold.price,
      rate,
      perGram: (gold.price / OZ) * rate,
      updatedAt: gold.updatedAt || new Date().toISOString(),
      at: Date.now(),
    };
    try {
      localStorage.setItem(GOLD_CACHE, JSON.stringify(spot));
    } catch {
      /* ignore */
    }
    return spot;
  } catch (e) {
    if (cached && cached.currency === currency) return { ...cached, stale: true };
    throw e;
  }
}

export const goldPriceFor = (perGram24, carat) => (perGram24 * (Number(carat) || 24)) / 24;
