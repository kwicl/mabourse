/**
 * Interrupteur du mode hologramme.
 * Ajoute/retire la classe `theme-hologram` sur <html> ; c'est la seule chose qui active la surcouche.
 * Sans cette classe, aucun style de hologram.css ne s'applique.
 */
import { useCallback, useEffect, useState } from 'react';
import { BASE_VARS, applyVars, themeById } from './palette';

const KEY = 'mabourse-hologram';
const THEME = 'mabourse-hologram-theme'; // id du thème de la surcouche (voir THEMES dans palette.js)
const THEME_KEY = 'mabourse-theme'; // clé existante de useTheme (lecture seule)
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

function applyTheme(id) {
  const t = themeById(id);
  applyVars(root, t.vars);
  root.dataset.holoTheme = t.id;
}
applyTheme(readTheme());

const read = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

// Le mode hologramme est sombre par nature : tant qu'il est actif, on garde la classe `dark`
// (sans toucher au choix clair/sombre enregistré par l'app, restauré à la désactivation).
let keepDark = null;

function originalDark() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t) return t === 'dark';
  } catch {
    /* ignore */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/* Version allégée : appareil modeste ou cadence d'image mesurée trop basse. */
function detectLite() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  if (cores <= 2 || mem <= 2) {
    root.classList.add('holo-lite');
    return;
  }
  let frames = 0;
  let start = 0;
  const probe = (t) => {
    if (!start) start = t;
    frames++;
    if (t - start < 1000) requestAnimationFrame(probe);
    else if (frames < 45) root.classList.add('holo-lite');
  };
  requestAnimationFrame(probe);
}

function apply(on) {
  root.classList.toggle(CLASS, on);
  if (on) {
    root.classList.add('dark');
    if (!keepDark) {
      keepDark = new MutationObserver(() => {
        if (root.classList.contains(CLASS) && !root.classList.contains('dark')) root.classList.add('dark');
      });
      keepDark.observe(root, { attributes: true, attributeFilter: ['class'] });
    }
    detectLite();
  } else {
    keepDark?.disconnect();
    keepDark = null;
    root.classList.remove('holo-lite');
    root.classList.toggle('dark', originalDark());
  }
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
  const [appearance, setApp] = useState(currentAppearance);
  useEffect(() => {
    const sync = () => setApp(currentAppearance());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const toggle = useCallback(() => setHologram(!root.classList.contains(CLASS)), []);
  return { on: appearance !== 'origin', toggle, appearance, setAppearance };
}
