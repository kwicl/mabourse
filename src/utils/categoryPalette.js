/**
 * Couleurs des catégories de dépense, attribuées par rang : la plus grosse catégorie reçoit la
 * 1re couleur de la palette du thème (l'accent), etc. Palette dérivée des tokens (src/theme/themes.js).
 * « Autre » / « Autres » reçoit la teinte neutre du thème.
 */
const isOther = (name) => /^autres?$/i.test(String(name ?? '').trim());

/** Recolore une liste triée par montant décroissant (ex. byCategoryRange). */
export function paletteByRank(cats, ramp, other) {
  let i = 0;
  return cats.map((c) => ({ ...c, color: isOther(c.name) ? other : ramp[i++ % ramp.length] }));
}
