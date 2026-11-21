/**
 * Liquid Glass : moteur sans dépendance du thème « liquid ».
 *  - injecte le filtre SVG de réfraction (#lg-refract) utilisé par backdrop-filter ;
 *  - active la réfraction seulement sur Chromium (seul moteur qui accepte url() dans
 *    backdrop-filter ; Safari / Firefox gardent un verre flou + saturé) ;
 *  - fait suivre le reflet spéculaire au pointeur (--lg-x / --lg-y) sur l'élément de verre survolé.
 * Toute surface de verre : .glass, .nav-bar, [role="dialog"] ou l'attribut `glass` (<div glass>).
 */
import { useCallback, useEffect, useState } from 'react';

const root = document.documentElement;
const SVG_NS = 'http://www.w3.org/2000/svg';
export const GLASS_SELECTOR = '.glass, .nav-bar, [role="dialog"], [glass]';

/* ---------- Photos d'arrière-plan (public/backgrounds) ---------- */

/** `light` : photo claire, le verre se fonce un peu plus pour garder le texte lisible. */
export const BACKGROUNDS = [
  { id: 'paper-plane', label: 'Avion de papier', src: '/backgrounds/paper-plane.jpg', light: false },
  { id: 'again-blue', label: 'Piste bleue', src: '/backgrounds/again-blue.jpg', light: false },
  { id: 'better-version', label: 'Better version', src: '/backgrounds/better-version.jpg', light: false },
  { id: 'green-light', label: 'Feu vert', src: '/backgrounds/green-light.jpg', light: false },
  { id: 'rise', label: 'Rise', src: '/backgrounds/rise.jpg', light: false },
  { id: 'make-today', label: 'Make today amazing', src: '/backgrounds/make-today.jpg', light: true },
  { id: 'again-hill', label: 'Colline', src: '/backgrounds/again-hill.jpg', light: true },
];
export const BG_AUTO = 'auto'; // une photo au hasard à chaque ouverture
const BG_KEY = 'mabourse-bg';
const BG_EVENT = 'mabourse-bg';

function storedBg() {
  try {
    const v = localStorage.getItem(BG_KEY);
    if (v === BG_AUTO || BACKGROUNDS.some((b) => b.id === v)) return v;
  } catch {
    /* ignore */
  }
  return BG_AUTO;
}

let bgChoice = storedBg();
let bgShown = null;

function applyBg() {
  const pick =
    bgChoice === BG_AUTO
      ? // Hasard, mais jamais deux fois de suite la même au changement de réglage
        BACKGROUNDS.filter((b) => b.id !== bgShown?.id)[Math.floor(Math.random() * (BACKGROUNDS.length - (bgShown ? 1 : 0)))]
      : BACKGROUNDS.find((b) => b.id === bgChoice);
  bgShown = pick;
  root.style.setProperty('--lg-image', `url('${pick.src}')`);
  root.dataset.lgBg = pick.id;
  root.classList.toggle('lg-light', pick.light);
}
applyBg();

export function setBackground(id) {
  bgChoice = id;
  try {
    localStorage.setItem(BG_KEY, id);
  } catch {
    /* ignore */
  }
  applyBg();
  window.dispatchEvent(new CustomEvent(BG_EVENT));
}

/** { choice: id choisi ou 'auto', shown: photo affichée, setBackground } */
export function useBackground() {
  const [state, set] = useState(() => ({ choice: bgChoice, shown: bgShown }));
  useEffect(() => {
    const sync = () => set({ choice: bgChoice, shown: bgShown });
    window.addEventListener(BG_EVENT, sync);
    return () => window.removeEventListener(BG_EVENT, sync);
  }, []);
  return { ...state, setBackground: useCallback((id) => setBackground(id), []) };
}

function injectFilter() {
  if (document.getElementById('lg-defs')) return;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.id = 'lg-defs';
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  // Bruit très basse fréquence, adouci : ondulation douce du fond, comme à travers une lame d'eau
  svg.innerHTML = `
    <filter id="lg-refract" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="11" result="noise" />
      <feGaussianBlur in="noise" stdDeviation="2.5" result="map" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="42" xChannelSelector="R" yChannelSelector="G" />
    </filter>`;
  document.body.appendChild(svg);
}

// navigator.userAgentData n'existe que sur Chromium (y compris Edge / Android), pas sur iOS
const canRefract = typeof navigator !== 'undefined' && !!navigator.userAgentData;
if (canRefract) root.classList.add('lg-refract');

if (document.body) injectFilter();
else document.addEventListener('DOMContentLoaded', injectFilter, { once: true });

// Reflet qui suit le pointeur (une seule écoute, limitée à une mise à jour par image)
let frame = 0;
let last = null;
document.addEventListener(
  'pointermove',
  (e) => {
    if (root.dataset.theme !== 'liquid' || frame) return;
    const { clientX, clientY, target } = e;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const el = target instanceof Element ? target.closest(GLASS_SELECTOR) : null;
      if (last && last !== el) last.style.removeProperty('--lg-on');
      last = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--lg-x', `${(((clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--lg-y', `${(((clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      el.style.setProperty('--lg-on', '1');
    });
  },
  { passive: true },
);
