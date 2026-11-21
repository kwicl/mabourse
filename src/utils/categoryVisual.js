/**
 * Icône et couleur de chaque catégorie, déduites de son nom : une couleur et une icône qui
 * évoquent la catégorie (café = brun + tasse, santé = rouge + stéthoscope…). Une même catégorie
 * garde la même couleur en dépense et en revenu, partout (listes, budgets, graphiques).
 * Sans règle correspondante, l'icône et la couleur de la feuille Categories sont conservées.
 */
import { categorySlug } from './categoryStyle';

// Ordre important : la première règle qui correspond l'emporte (les plus précises d'abord)
const RULES = [
  [/aliment|courses|epicerie/, 'ShoppingBasket', '#F97316'],
  [/cafe/, 'Coffee', '#92582F'],
  [/restau/, 'UtensilsCrossed', '#EA580C'],
  [/voyage/, 'Plane', '#0EA5E9'],
  [/sante|medecin|pharma/, 'Stethoscope', '#EF4444'],
  [/bien-etre|beaute|sport/, 'Sparkles', '#EC4899'],
  [/vetement/, 'Shirt', '#D946EF'],
  [/electro/, 'Refrigerator', '#06B6D4'],
  [/it-|techno|informatique/, 'Laptop', '#6366F1'],
  [/deplacement|transport|carburant|essence/, 'Car', '#3B82F6'],
  [/villa-camelia/, 'Trees', '#14B8A6'],
  [/villa/, 'House', '#10B981'],
  [/appart.*kenitra/, 'Building2', '#8B5CF6'],
  [/appart.*casa/, 'Building', '#A855F7'],
  [/appart/, 'Building2', '#7C3AED'],
  [/maison|frais-de-service|loyer|logement/, 'Wrench', '#B45309'],
  [/educ|ecole|enfant/, 'GraduationCap', '#EAB308'],
  [/invest.*(lot|terrain|sahel)/, 'LandPlot', '#65A30D'],
  [/invest|bourse|action/, 'TrendingUp', '#16A34A'],
  [/salaire/, 'Briefcase', '#059669'],
  [/freelance/, 'Laptop', '#22C55E'],
  [/loisir|cinema|jeu/, 'Gamepad2', '#F43F5E'],
  [/cadeau/, 'Gift', '#A855F7'],
  [/facture|electricite|eau|internet/, 'Zap', '#EAB308'],
  [/especes|cash/, 'Banknote', '#22C55E'],
  [/autres?-revenus?/, 'HandCoins', '#0D9488'],
  [/^autres?$/, 'Ellipsis', '#94A3B8'],
];

/** { icon, color } pour une catégorie ({ id, name, icon, color }). */
export function categoryVisual(cat) {
  if (!cat) return { icon: 'Circle', color: '#94A3B8' };
  const slug = categorySlug(String(cat.name || cat.id || ''));
  const rule = RULES.find(([re]) => re.test(slug));
  if (rule) return { icon: rule[1], color: rule[2] };
  return { icon: cat.icon || 'Circle', color: cat.color || '#94A3B8' };
}

/** Catégorie avec son icône et sa couleur. */
export const withVisual = (cat) => (cat ? { ...cat, ...categoryVisual(cat) } : cat);
