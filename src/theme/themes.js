/**
 * Système de thèmes 60 / 30 / 10.
 *   60 % main   : fond de page, grandes surfaces.
 *   30 % second : cartes, navigation, en-têtes, panneaux, champs de saisie.
 *   10 % accent : CTA, élément actif, icônes clés, badges, liens, switchs, graphique mis en avant.
 *
 * Seules les couleurs ci-dessous sont saisies à la main ; tout le reste (bordure, textes atténués,
 * variantes lisibles de l'accent et des couleurs d'état, palette des graphiques) en est dérivé,
 * avec un contraste texte/fond vérifié (WCAG AA, 4.5:1) et corrigé si besoin.
 */

/** Couleurs d'état : identiques d'un thème à l'autre. */
export const STATUS = { success: '#2E9D62', warning: '#E0A100', error: '#E0483E' };

/**
 * Design d'origine « Pantheon » (Parthénon au crépuscule, terre cuite) : seul thème avec une
 * variante jour et une variante nuit. Il garde ses propres couleurs d'état et sa palette de
 * catégories « crépuscule antique », ainsi que les tons relevés dans l'image de fond (pt).
 */
const ORIGIN_STATUS = { success: '#6F7F55', warning: '#D97706', error: '#C2603F' };
const ORIGIN_RAMP = ['#C8643B', '#5B7A99', '#B8862F', '#4F8A7E', '#8E5A7A', '#9C4A3A', '#8A7FAA', '#B87A5E', '#7A8A4B'];
const ORIGIN_PT = { slate: '#1E262D', sunset: '#D67634', marble: '#EEE5D6' };

export const ORIGIN = 'origine';
export const ORIGIN_NIGHT = 'origine-nuit';
export const LIQUID = 'liquid';

/** Liquid Glass : verre réfractif sur fond photo crépusculaire (voir liquid.css / liquid-glass.js). */
const LIQUID_RAMP = ['#FF8F5E', '#7CB8FF', '#C79BFF', '#5EE0C0', '#FFD166', '#FF6B9A', '#9AA7FF', '#8BE08A', '#F2A65A'];

export const THEMES = [
  { id: LIQUID, label: 'Liquid Glass', desc: 'Verre liquide, réfraction', mode: 'dark', main: '#0B1022', second: '#1A2140', accent: '#FF8F5E', textOnMain: '#F4F6FF', textOnSecond: '#F4F6FF', textOnAccent: '#1A1020', ramp: LIQUID_RAMP, other: '#8A93B0' },
  { id: ORIGIN, label: "Design d'origine", desc: 'Parthénon, terre cuite', mode: 'light', main: '#FBF9F5', second: '#FFFFFF', accent: '#CC5A37', textOnMain: '#191919', textOnSecond: '#191919', textOnAccent: '#FFFFFF', status: ORIGIN_STATUS, ramp: ORIGIN_RAMP, other: '#8C857A', pt: ORIGIN_PT },
  { id: ORIGIN_NIGHT, label: "Design d'origine", desc: 'Parthénon, terre cuite', mode: 'dark', hidden: true, main: '#1A1714', second: '#221F1B', accent: '#DA7756', textOnMain: '#F3EFE7', textOnSecond: '#F3EFE7', textOnAccent: '#191919', status: ORIGIN_STATUS, ramp: ORIGIN_RAMP, other: '#8C857A', pt: ORIGIN_PT },
  { id: 'acier', label: 'Acier & Jaune', mode: 'dark', main: '#111111', second: '#8A939B', accent: '#FFC300', textOnMain: '#FFFFFF', textOnSecond: '#111111', textOnAccent: '#111111' },
  { id: 'anthracite', label: 'Anthracite & Bleu', mode: 'dark', main: '#2B2D31', second: '#FFFFFF', accent: '#2F6BFF', textOnMain: '#FFFFFF', textOnSecond: '#2B2D31', textOnAccent: '#FFFFFF' },
  { id: 'sauge', label: 'Sauge & Chocolat', mode: 'light', main: '#F3EBDD', second: '#9CAF88', accent: '#4A2E22', textOnMain: '#4A2E22', textOnSecond: '#2A2A1F', textOnAccent: '#F3EBDD' },
  { id: 'oat', label: 'Oat Milk & Tomate', mode: 'light', main: '#E9DFCC', second: '#2F5D46', accent: '#F2462E', textOnMain: '#1F1F1A', textOnSecond: '#F3EBDD', textOnAccent: '#FFFFFF' },
  { id: 'navy', label: 'Navy & Tournesol', mode: 'dark', main: '#1C2433', second: '#A9BCD0', accent: '#FFC20D', textOnMain: '#FFFFFF', textOnSecond: '#1C2433', textOnAccent: '#1C2433' },
  { id: 'blush', label: 'Blush & Menthe', mode: 'light', main: '#F5D9D9', second: '#2B2E35', accent: '#22E3A2', textOnMain: '#2B2E35', textOnSecond: '#FFFFFF', textOnAccent: '#0F2E24' },
];

export const DEFAULT_THEME = LIQUID;

/** Thèmes proposés dans le sélecteur (la variante nuit du design d'origine passe par sa bascule jour / nuit). */
export const PICKER_THEMES = THEMES.filter((t) => !t.hidden);
export const isOrigin = (id) => id === ORIGIN || id === ORIGIN_NIGHT;

/* ---------- Couleur ---------- */

const toRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
const BLACK = '#000000';
const WHITE = '#FFFFFF';

/** Mélange a → b (t = 0 : a, t = 1 : b). */
export const mix = (a, b, t) => {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};

const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

/** Rapproche `fg` du noir ou du blanc (le plus contrasté) jusqu'à atteindre `min` sur `bg`. */
export function ensure(fg, bg, min = 4.5) {
  if (contrast(fg, bg) >= min) return fg;
  const pole = contrast(BLACK, bg) >= contrast(WHITE, bg) ? BLACK : WHITE;
  for (let t = 0.02; t <= 1; t += 0.02) {
    const c = mix(fg, pole, t);
    if (contrast(c, bg) >= min) return c;
  }
  return pole;
}

/** Texte atténué : `fg` adouci vers le fond, sans descendre sous 4.5:1. */
function muted(fg, bg) {
  for (let t = 0.4; t > 0; t -= 0.02) {
    const c = mix(fg, bg, t);
    if (contrast(c, bg) >= 4.5) return c;
  }
  return fg;
}

/** Bordure : `second` éclairci ou assombri de 12 %. */
const border = (second) => (luminance(second) > 0.18 ? mix(second, BLACK, 0.12) : mix(second, WHITE, 0.12));

/** Variantes lisibles sur une surface donnée. */
function onSurface(bg, fg, accent, STATUS) {
  return {
    fg,
    muted: muted(fg, bg),
    accentInk: ensure(accent, bg, 4.5),
    accentGfx: ensure(accent, bg, 3),
    successInk: ensure(STATUS.success, bg, 4.5),
    warningInk: ensure(STATUS.warning, bg, 4.5),
    errorInk: ensure(STATUS.error, bg, 4.5),
    successGfx: ensure(STATUS.success, bg, 3),
    warningGfx: ensure(STATUS.warning, bg, 3),
    errorGfx: ensure(STATUS.error, bg, 3),
  };
}

/** Tous les tokens d'un thème (couleurs hex). */
export function tokensOf(theme) {
  const onMain = ensure(theme.textOnMain, theme.main);
  const onSecond = ensure(theme.textOnSecond, theme.second);
  const onAccent = ensure(theme.textOnAccent, theme.accent);
  const status = theme.status || STATUS;
  const s = onSurface(theme.second, onSecond, theme.accent, status);
  const m = onSurface(theme.main, onMain, theme.accent, status);
  const A = s.accentGfx;
  const F = onSecond;
  const S = theme.second;
  return {
    id: theme.id,
    label: theme.label,
    dark: theme.mode === 'dark',
    main: theme.main,
    second: theme.second,
    accent: theme.accent,
    textOnMain: onMain,
    textOnSecond: onSecond,
    textOnAccent: onAccent,
    border: border(theme.second),
    ...status,
    pt: theme.pt,
    shadow: mix(theme.main, BLACK, 0.8),
    accentHi: mix(theme.accent, WHITE, 0.45),
    onMain: m,
    onSecond: s,
    // Palette des graphiques par rang (sur carte) : uniquement accent + texte de carte + carte
    ramp: theme.ramp || [A, F, mix(A, F, 0.5), mix(A, S, 0.45), mix(F, S, 0.4), mix(A, F, 0.25), mix(A, F, 0.75), mix(F, S, 0.6)],
    other: theme.other || mix(F, S, 0.72),
    // Rapports de contraste (pour l'écran de démonstration)
    ratios: {
      main: contrast(onMain, theme.main),
      second: contrast(onSecond, theme.second),
      accent: contrast(onAccent, theme.accent),
    },
    adjusted: {
      textOnMain: onMain !== theme.textOnMain.toUpperCase(),
      textOnSecond: onSecond !== theme.textOnSecond.toUpperCase(),
      textOnAccent: onAccent !== theme.textOnAccent.toUpperCase(),
    },
  };
}

export const TOKENS = Object.fromEntries(THEMES.map((t) => [t.id, tokensOf(t)]));
export const themeById = (id) => TOKENS[id] || TOKENS[DEFAULT_THEME];

/* ---------- CSS ---------- */

const trip = (hex) => toRgb(hex).join(' ');

const surfaceVars = (p, v) => ({
  [`--${p}-muted`]: v.muted,
  [`--${p}-accent-ink`]: v.accentInk,
  [`--${p}-success-ink`]: v.successInk,
  [`--${p}-warning-ink`]: v.warningInk,
  [`--${p}-error-ink`]: v.errorInk,
});

/** Règles `[data-theme="id"] { --main: r g b; … }` pour tous les thèmes. */
export function themesCss() {
  return Object.values(TOKENS)
    .map((t) => {
      const vars = {
        '--main': t.main,
        '--second': t.second,
        '--accent': t.accent,
        '--on-main': t.textOnMain,
        '--on-second': t.textOnSecond,
        '--on-accent': t.textOnAccent,
        '--border': t.border,
        '--success': t.success,
        '--warning': t.warning,
        '--error': t.error,
        '--shadow': t.shadow,
        '--accent-hi': t.accentHi,
        ...(t.pt ? { '--pt-slate': t.pt.slate, '--pt-sunset': t.pt.sunset, '--pt-marble': t.pt.marble } : {}),
        ...surfaceVars('m', t.onMain),
        ...surfaceVars('s', t.onSecond),
      };
      const body = Object.entries(vars)
        .map(([k, v]) => `${k}:${trip(v)};`)
        .join('');
      return `[data-theme="${t.id}"]{${body}color-scheme:${t.dark ? 'dark' : 'light'};}`;
    })
    .join('\n');
}
