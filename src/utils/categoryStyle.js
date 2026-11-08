/**
 * Caractéristiques d'une nouvelle catégorie saisie dans l'app : mêmes règles que l'import
 * Apps Script (google-apps-script/Code.gs : importCategory_ / importIcon_ / IMPORT_PALETTE),
 * pour qu'une catégorie créée à la main ressemble à celles issues du Google Sheet.
 */
const PALETTE = ['#5b5bf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#14b8a6', '#84cc16', '#a855f7', '#eab308', '#6366f1'];

const ICON_RULES = [
  [/salaire/, 'Briefcase'], [/invest|bourse|action/, 'TrendingUp'], [/cafe/, 'Coffee'],
  [/aliment/, 'ShoppingBasket'], [/villa|appart|maison/, 'Home'], [/educ|enfant/, 'GraduationCap'],
  [/sante|bien/, 'HeartPulse'], [/voyage/, 'Plane'], [/deplacement/, 'Car'], [/it-|techno/, 'Laptop'],
  [/electro/, 'Zap'], [/loisir/, 'Gamepad2'], [/vetement/, 'ShoppingBag'],
];

/** « Électroménager » -> « electromenager » (identifiant lisible, comme l'import). */
export function categorySlug(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function iconFor(slug, type) {
  const rule = ICON_RULES.find(([re]) => re.test(slug));
  return rule ? rule[1] : type === 'income' ? 'Wallet' : 'Circle';
}

/** Ligne prête pour la feuille Categories : { id, name, type, icon, color }. */
export function buildCategory(name, type, existing) {
  const clean = name.trim().replace(/\s+/g, ' ');
  const id = categorySlug(clean);
  const used = new Set(existing.map((c) => String(c.color).toLowerCase()));
  const color = PALETTE.find((p) => !used.has(p)) ?? PALETTE[existing.length % PALETTE.length];
  return { id, name: clean, type, icon: iconFor(id, type), color };
}
