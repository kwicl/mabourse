/**
 * Palette « crépuscule antique » (tons du fond Parthénon + design de l'app) pour les dépenses par catégorie.
 * Attribuée par rang : la plus grosse catégorie reçoit la 1re couleur, etc. Chaud et froid alternent
 * pour que deux parts voisines du donut ne se confondent pas. Contraste ≥ 3:1 sur fond crème.
 */
const PRIORITY = [
  '#C8643B', // terre cuite
  '#5B7A99', // bleu ardoise
  '#B8862F', // ocre doré
  '#4F8A7E', // vert-de-gris
  '#8E5A7A', // prune
  '#9C4A3A', // brique
  '#8A7FAA', // lavande cendrée
  '#B87A5E', // vieux rose
  '#7A8A4B', // olive (proche des revenus : rang secondaire)
];

// Au-delà des 9 couleurs prioritaires : mêmes tons sourds, toujours en alternance chaud / froid
const EXTRA = ['#A0674B', '#4C6A80', '#A8834F', '#5E8B6E', '#7D5F8C', '#5F7F8C', '#8F5B4A', '#6E7FA3'];

/** Couleur neutre réservée à « Autre » / « Autres ». */
export const STONE = '#8C857A';

const COLORS = [...PRIORITY, ...EXTRA];
const isOther = (name) => /^autres?$/i.test(String(name ?? '').trim());

/** Recolore une liste triée par montant décroissant (ex. byCategoryRange). */
export function paletteByRank(cats) {
  let i = 0;
  return cats.map((c) => ({ ...c, color: isOther(c.name) ? STONE : COLORS[i++ % COLORS.length] }));
}
