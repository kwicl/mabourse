/**
 * Palette de la surcouche (bulle + mode hologramme).
 * Aucune couleur n'est codée ici : tout est lu dans tailwind.config.js (design existant),
 * puis exposé en variables CSS. Les teintes holographiques (cyan / bleu électrique / violet)
 * sont obtenues par rotation de teinte de la couleur d'accent d'origine.
 */
import tw from '../../tailwind.config.js';

const c = tw.theme.extend.colors;

function hexToHsl(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

const rgbTriplet = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const hsl = ({ h, s, l }) => `${Math.round(((h % 360) + 360) % 360)} ${Math.round(s)}% ${Math.round(l)}%`;

const accent = hexToHsl(c.accent.DEFAULT);
// Rotation de teinte depuis l'accent d'origine (≈14° terracotta) vers les tons hologramme.
const rot = (deg, s, l) => hsl({ h: accent.h + deg, s: Math.max(accent.s, s), l });

/** Variables toujours présentes (bulle en couleurs d'origine). */
export const BASE_VARS = {
  '--mb-accent': rgbTriplet(c.accent.DEFAULT),
  '--mb-accent-soft': rgbTriplet(c.accent.soft),
  '--mb-ink': rgbTriplet(c.ink[50]),
  '--mb-ink-900': rgbTriplet(c.ink[900]),
  '--mb-night': rgbTriplet(c.night.DEFAULT),
  '--mb-night-card': rgbTriplet(c.night.card),
};

/** Variables du mode hologramme (format HSL « h s% l% », utilisable avec hsl(var(--x) / a)). */
export const HOLO_VARS = {
  '--holo-cyan': rot(172, 90, 62),
  '--holo-blue': rot(205, 95, 64),
  '--holo-violet': rot(255, 85, 70),
  '--holo-accent': rot(0, 80, 66), // accent d'origine éclairci pour rester AA sur fond sombre
  '--holo-text': hsl({ h: accent.h + 190, s: 30, l: 94 }),
  '--holo-muted': hsl({ h: accent.h + 200, s: 18, l: 72 }),
  '--holo-bg': hsl({ h: accent.h + 215, s: 45, l: 5 }),
  '--holo-bg-2': hsl({ h: accent.h + 235, s: 40, l: 9 }),
  '--holo-income': hsl({ ...hexToHsl(c.income), s: 55, l: 66 }),
  '--holo-expense': hsl({ ...hexToHsl(c.expense), s: 85, l: 70 }),
};

/** Construit un jeu de variables --holo-* à partir de couleurs hex (même format HSL que HOLO_VARS). */
const fromHex = (p) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [`--holo-${k}`, hsl(hexToHsl(v))]));

/**
 * Thèmes de la surcouche. Chaque thème a deux variantes (`dark` = mode nuit, `light` = mode jour)
 * qui remplissent les mêmes 10 emplacements : cyan / blue / violet = halos et reflets
 * (ordre : dominant, secondaire, tertiaire). Les fonds portent la teinte du thème pour que
 * chaque thème se reconnaisse au premier coup d'œil.
 */
const T = (id, label, desc, dark, light) => ({ id, label, desc, dark: fromHex(dark), light: fromHex(light) });

export const THEMES = [
  {
    id: 'hologram', label: 'Hologramme', desc: 'Cyan, bleu électrique, violet',
    dark: HOLO_VARS,
    light: fromHex({ cyan: '#0095B3', blue: '#2F5BFF', violet: '#7B3FE4', accent: '#C2481F', text: '#0B1530', muted: '#4C5C7A', bg: '#EAF4FF', 'bg-2': '#D6E4FF', income: '#1F7F55', expense: '#C9304A' }),
  },
  T('sakura', 'Cerisier en fleur', 'Rose poudré, prune, feuille',
    { cyan: '#FF8FB8', blue: '#FFC2D6', violet: '#9DD67A', accent: '#FFD27A', text: '#FFEFF4', muted: '#C9A2B2', bg: '#1F0A14', 'bg-2': '#3A1428', income: '#9DD67A', expense: '#FF6B6B' },
    { cyan: '#D63A78', blue: '#B0306A', violet: '#4F8F2F', accent: '#A8650A', text: '#3A0F22', muted: '#7D5566', bg: '#FFF0F5', 'bg-2': '#FFD6E5', income: '#3D7F2A', expense: '#C62F3B' }),
  T('saffron', 'Safran et indigo', 'Safran, indigo, vermillon',
    { cyan: '#FFB627', blue: '#6F7DFF', violet: '#FF5E3A', accent: '#FFE08A', text: '#FFF6E0', muted: '#C4B48F', bg: '#0D0B2A', 'bg-2': '#1E1C55', income: '#7FD99A', expense: '#FF6B5E' },
    { cyan: '#B86E00', blue: '#3343C9', violet: '#D63A1A', accent: '#8A5A00', text: '#1A1640', muted: '#5E5A7D', bg: '#FFF7E3', 'bg-2': '#FFE3A6', income: '#2E7D4A', expense: '#C0392B' }),
  T('lagoon', 'Lagon et corail', 'Turquoise, corail, sable',
    { cyan: '#2EE6D6', blue: '#FF8A6B', violet: '#FFD59E', accent: '#FF9F80', text: '#E6FFFB', muted: '#8FBFB9', bg: '#01262A', 'bg-2': '#044542', income: '#8CF0B4', expense: '#FF5C7A' },
    { cyan: '#00897B', blue: '#E4573F', violet: '#B87A1E', accent: '#C9452E', text: '#06302F', muted: '#4E7370', bg: '#E3FAF6', 'bg-2': '#FFE1D6', income: '#1B7F4F', expense: '#C2334D' }),
  T('lava', 'Lave', 'Magma, ambre, carmin',
    { cyan: '#FF5A1F', blue: '#FFB800', violet: '#E0234E', accent: '#FFD27A', text: '#FFF0E6', muted: '#C79F8F', bg: '#1A0503', 'bg-2': '#3D0F07', income: '#A8E07A', expense: '#FF4D6A' },
    { cyan: '#D9480F', blue: '#A86E00', violet: '#B0122F', accent: '#A34700', text: '#2E0E05', muted: '#7A5245', bg: '#FFF1E6', 'bg-2': '#FFD5B8', income: '#3F7F1F', expense: '#C2183A' }),
  T('onyx', 'Onyx et or', 'Noir laqué, or, champagne',
    { cyan: '#E8C468', blue: '#F5E6C4', violet: '#B8804A', accent: '#E8C468', text: '#F7F1E3', muted: '#A89E8C', bg: '#0A0908', 'bg-2': '#1C1813', income: '#A8CC8E', expense: '#E27A6A' },
    { cyan: '#9A7212', blue: '#6B5A3A', violet: '#8A5A2B', accent: '#8F6210', text: '#1F1A12', muted: '#6E6455', bg: '#FBF6EA', 'bg-2': '#EEDFBE', income: '#4D7A33', expense: '#B04A3A' }),
  T('bordeaux', 'Velours bordeaux', 'Grenat, or rose, crème',
    { cyan: '#FF6F91', blue: '#F2B5A0', violet: '#E0245E', accent: '#F2C79B', text: '#FFEDF1', muted: '#C49AA5', bg: '#1E0510', 'bg-2': '#420D26', income: '#9BD9A6', expense: '#FF8A5C' },
    { cyan: '#A8123F', blue: '#B5654E', violet: '#7A0A2E', accent: '#A0522D', text: '#2E0716', muted: '#7A4E5A', bg: '#FFF0F2', 'bg-2': '#F3CED7', income: '#2F7A45', expense: '#C2410C' }),
  T('matcha', 'Matcha et cuivre', 'Thé vert, cuivre, menthe',
    { cyan: '#A8D672', blue: '#E08A4F', violet: '#5FBFA0', accent: '#F2C46D', text: '#F1F8E6', muted: '#A3B48E', bg: '#0C1406', 'bg-2': '#1E2E10', income: '#A8D672', expense: '#FF7A5C' },
    { cyan: '#4F7F17', blue: '#B5541E', violet: '#2E8A6E', accent: '#9A6A0E', text: '#1A260C', muted: '#5D6B4C', bg: '#F3F8E8', 'bg-2': '#DDEBC0', income: '#3E7A1A', expense: '#C0441E' }),
  T('lavender', 'Lavande de Provence', 'Lavande, miel, olivier',
    { cyan: '#B79CFF', blue: '#FFD166', violet: '#9CC46E', accent: '#FFB0D0', text: '#F3EEFF', muted: '#ADA3C7', bg: '#120D24', 'bg-2': '#271C4A', income: '#A6D67E', expense: '#FF7A9A' },
    { cyan: '#6A4BC4', blue: '#A67A00', violet: '#5E7F2E', accent: '#B0487A', text: '#1E1538', muted: '#615878', bg: '#F5F0FF', 'bg-2': '#E2D6FF', income: '#4A7A22', expense: '#C2335A' }),
  T('miami', 'Miami 86', 'Fuchsia, soleil, piscine',
    { cyan: '#FF3DCB', blue: '#FFE14D', violet: '#2EE6E6', accent: '#FF8A3D', text: '#FFF0FB', muted: '#C9A3C2', bg: '#1A0626', 'bg-2': '#320B4A', income: '#5EF2B0', expense: '#FF5470' },
    { cyan: '#C2189A', blue: '#9A7400', violet: '#00838A', accent: '#C9510C', text: '#2A0838', muted: '#6E4E73', bg: '#EFFFFD', 'bg-2': '#FFE0F4', income: '#1E7F55', expense: '#C2263F' }),
];

/** Variables du thème pour le mode courant (nuit ou jour). */
export const themeVars = (t, dark) => (dark ? t.dark : t.light);

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

export function applyVars(el, vars) {
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
}
