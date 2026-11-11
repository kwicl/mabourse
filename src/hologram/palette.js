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
 * Thèmes de la surcouche. Chaque thème remplit les mêmes 10 emplacements :
 * cyan / blue / violet = halos et reflets (ordre : dominant, secondaire, tertiaire).
 */
export const THEMES = [
  { id: 'hologram', label: 'Hologramme', desc: 'Cyan, bleu électrique, violet', vars: HOLO_VARS },
  {
    id: 'aurora', label: 'Aurore boréale', desc: 'Vert polaire, turquoise, magenta',
    vars: fromHex({ cyan: '#4BF2A0', blue: '#2FD3C8', violet: '#D96CFF', accent: '#F2B45A', text: '#E8FFF5', muted: '#9CC4B6', bg: '#03110D', 'bg-2': '#08201A', income: '#6FE3A1', expense: '#FF7D8C' }),
  },
  {
    id: 'synthwave', label: 'Synthwave', desc: 'Rose néon, orange, violet',
    vars: fromHex({ cyan: '#FF4FA3', blue: '#FF9E4A', violet: '#8F5BFF', accent: '#FFD166', text: '#FCEBFF', muted: '#B9A3CC', bg: '#12061F', 'bg-2': '#1F0B33', income: '#5EE6B8', expense: '#FF5C7A' }),
  },
  {
    id: 'abyss', label: 'Abysses', desc: 'Bioluminescence marine',
    vars: fromHex({ cyan: '#00E0FF', blue: '#2B6CFF', violet: '#7CFFCB', accent: '#FFB86B', text: '#E3F7FF', muted: '#8DAFC4', bg: '#020A14', 'bg-2': '#061A2B', income: '#7CFFCB', expense: '#FF7A7A' }),
  },
  {
    id: 'ember', label: 'Braise', desc: 'Volcan, ambre, carmin',
    vars: fromHex({ cyan: '#FF6A3D', blue: '#FFB347', violet: '#E8344E', accent: '#FFD38A', text: '#FFF0E6', muted: '#C9A99A', bg: '#140605', 'bg-2': '#24100C', income: '#8FD694', expense: '#FF5468' }),
  },
  {
    id: 'onyx', label: 'Onyx et or', desc: 'Luxe, champagne, bronze',
    vars: fromHex({ cyan: '#E6C27A', blue: '#F3E3BF', violet: '#B07A45', accent: '#E6C27A', text: '#F7F1E3', muted: '#ABA190', bg: '#0B0A08', 'bg-2': '#1A1712', income: '#9FCC8E', expense: '#E27A6A' }),
  },
  {
    id: 'jade', label: 'Jade impérial', desc: 'Jade, or, laque rouge',
    vars: fromHex({ cyan: '#3FCFA0', blue: '#E8C46A', violet: '#E2553F', accent: '#E8C46A', text: '#EAF7F1', muted: '#9BBDB0', bg: '#04120F', 'bg-2': '#0A221C', income: '#6FD6A0', expense: '#F06B5A' }),
  },
  {
    id: 'nebula', label: 'Nébuleuse', desc: 'Lavande, rose cosmique, bleu',
    vars: fromHex({ cyan: '#B085FF', blue: '#FF7AD9', violet: '#6FD6FF', accent: '#FFC37A', text: '#F1EDFF', muted: '#A9A3C9', bg: '#070616', 'bg-2': '#130F2E', income: '#7BE0B5', expense: '#FF7A9A' }),
  },
  {
    // Revenus en vert menthe (et non phosphore) pour rester distincts des halos.
    id: 'terminal', label: 'Terminal', desc: 'Phosphore vert, rétro',
    vars: fromHex({ cyan: '#39FF7A', blue: '#A6FF4D', violet: '#00D18F', accent: '#FFB000', text: '#D9FFE3', muted: '#86B894', bg: '#020B04', 'bg-2': '#08170B', income: '#7FE0C8', expense: '#FF5F56' }),
  },
  {
    id: 'arctic', label: 'Glace arctique', desc: 'Bleu glacier, blanc, saphir',
    vars: fromHex({ cyan: '#9BE7FF', blue: '#E3F6FF', violet: '#6FA8FF', accent: '#FFB4A2', text: '#F2FAFF', muted: '#9DB4C4', bg: '#061018', 'bg-2': '#0D1E2C', income: '#8EE3C2', expense: '#FF8A95' }),
  },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

export function applyVars(el, vars) {
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
}
