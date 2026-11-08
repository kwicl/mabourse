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

export function applyVars(el, vars) {
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
}
