/**
 * Thème courant : sauvegardé (localStorage), appliqué dès l'import (avant le premier rendu),
 * changé instantanément sans rechargement via l'attribut `data-theme` de <html>.
 */
import { useCallback, useEffect, useState } from 'react';
import { LIQUID, ORIGIN, ORIGIN_NIGHT, TOKENS, isOrigin, themeById, themesCss } from './themes';

const KEY = 'mabourse-theme';
const BG = 'mabourse-theme-bg'; // couleur de fond, relue par index.html pour éviter un flash au lancement
const EVENT = 'mabourse-theme';
const ORIGIN_MODE = 'mabourse-origin-mode'; // jour / nuit du design d'origine
const LIQUID_ONCE = 'mabourse-liquid-v1'; // passage unique au thème Liquid Glass
const root = document.documentElement;

// Feuille des tokens de tous les thèmes (aussi utilisée par les aperçus côte à côte)
const style = document.createElement('style');
style.id = 'theme-tokens';
style.textContent = themesCss();
document.head.appendChild(style);

function stored() {
  try {
    // Nouveau design : Liquid Glass appliqué une fois, l'utilisateur peut ensuite rechoisir
    if (!localStorage.getItem(LIQUID_ONCE)) {
      localStorage.setItem(LIQUID_ONCE, '1');
      localStorage.setItem(KEY, LIQUID);
      return LIQUID;
    }
    const v = localStorage.getItem(KEY);
    if (TOKENS[v]) return v;
    // Ancien réglage jour / nuit du design d'origine
    if (v === 'dark') return ORIGIN_NIGHT;
    if (v === 'light') return ORIGIN;
  } catch {
    /* ignore */
  }
  return LIQUID;
}

function apply(id) {
  const t = themeById(id);
  root.dataset.theme = t.id;
  root.classList.toggle('dark', t.dark);
  root.style.background = t.main;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = t.main;
  try {
    localStorage.setItem(BG, t.main);
  } catch {
    /* ignore */
  }
  return t;
}

apply(stored());

/** Variante (jour / nuit) du design d'origine mémorisée. */
function originVariant() {
  try {
    const m = localStorage.getItem(ORIGIN_MODE);
    if (m) return m === 'dark' ? ORIGIN_NIGHT : ORIGIN;
  } catch {
    /* ignore */
  }
  return root.dataset.theme === ORIGIN_NIGHT ? ORIGIN_NIGHT : ORIGIN;
}

/** `exact` : applique l'id tel quel (bascule jour / nuit), sans reprendre la variante mémorisée. */
export function setTheme(id, exact = false) {
  // Choisir « Design d'origine » reprend sa dernière variante jour / nuit
  const t = apply(id === ORIGIN && !exact ? originVariant() : id);
  if (isOrigin(t.id)) {
    try {
      localStorage.setItem(ORIGIN_MODE, t.dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.setItem(KEY, t.id);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

const current = () => themeById(root.dataset.theme);

/** { theme: tokens du thème courant, setTheme } */
export function useAppTheme() {
  const [theme, set] = useState(current);
  useEffect(() => {
    const sync = () => set(current());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return {
    theme,
    setTheme: useCallback((id) => setTheme(id), []),
    /** Design d'origine actif (jour ou nuit) : la bascule jour / nuit est proposée. */
    origin: isOrigin(theme.id),
    toggleOriginMode: useCallback(() => setTheme(current().id === ORIGIN_NIGHT ? ORIGIN : ORIGIN_NIGHT, true), []),
  };
}
