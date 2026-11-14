/**
 * Interrupteur du mode hologramme.
 * Ajoute/retire la classe `theme-hologram` sur <html> ; c'est la seule chose qui active la surcouche.
 * Sans cette classe, aucun style de hologram.css ne s'applique.
 * Le mode jour/nuit de l'app (classe `dark`, voir useTheme) reste respecté : chaque thème a une
 * variante nuit et une variante jour, échangées automatiquement quand la classe `dark` change.
 */
import { useCallback, useEffect, useState } from 'react';
import { BASE_VARS, applyVars, themeById, themeVars } from './palette';

const KEY = 'mabourse-hologram';
const THEME = 'mabourse-hologram-theme'; // id du thème de la surcouche (voir THEMES dans palette.js)
const CLASS = 'theme-hologram';
const EVENT = 'mabourse-hologram';
const root = document.documentElement;

applyVars(root, BASE_VARS);

const readTheme = () => {
  try {
    return themeById(localStorage.getItem(THEME)).id;
  } catch {
    return themeById().id;
  }
};

const isDark = () => root.classList.contains('dark');

function applyTheme(id) {
  const t = themeById(id);
  applyVars(root, themeVars(t, isDark()));
  root.dataset.holoTheme = t.id;
}
applyTheme(readTheme());

// Bascule jour/nuit : on réapplique la bonne variante du thème courant.
let lastDark = isDark();
new MutationObserver(() => {
  const d = isDark();
  if (d === lastDark) return;
  lastDark = d;
  applyTheme(root.dataset.holoTheme);
  window.dispatchEvent(new CustomEvent(EVENT));
}).observe(root, { attributes: true, attributeFilter: ['class'] });

const read = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

/* Version allégée : uniquement sur un appareil vraiment modeste (les iPhone ne sont jamais concernés). */
function detectLite() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  root.classList.toggle('holo-lite', cores <= 2 && mem <= 2);
}

function apply(on) {
  root.classList.toggle(CLASS, on);
  if (on) detectLite();
  else root.classList.remove('holo-lite');
}

export function setHologram(on) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  apply(on);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: on }));
}

/** Choisit l'apparence : 'origin' (design d'origine) ou l'id d'un thème de la surcouche. */
export function setAppearance(id) {
  if (id === 'origin') return setHologram(false);
  try {
    localStorage.setItem(THEME, themeById(id).id);
  } catch {
    /* ignore */
  }
  applyTheme(id);
  setHologram(true);
}

const currentAppearance = () =>
  root.classList.contains(CLASS) ? root.dataset.holoTheme || themeById().id : 'origin';

// Appliqué dès l'import (avant le premier rendu) pour éviter un flash.
if (read()) apply(true);

export function useHologram() {
  const [state, setState] = useState(() => ({ appearance: currentAppearance(), dark: isDark() }));
  useEffect(() => {
    const sync = () => setState({ appearance: currentAppearance(), dark: isDark() });
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const toggle = useCallback(() => setHologram(!root.classList.contains(CLASS)), []);
  return { on: state.appearance !== 'origin', toggle, appearance: state.appearance, dark: state.dark, setAppearance };
}
