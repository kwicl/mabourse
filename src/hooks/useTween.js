import { useEffect, useRef, useState } from 'react';
import { animate } from '../utils/animate';

/** Ré-échantillonne une série à `n` points (interpolation linéaire), pour animer entre deux longueurs. */
export function resample(src, n) {
  if (src.length === n) return src;
  const out = new Array(n).fill(0);
  if (!src.length || !n) return out;
  if (n === 1 || src.length === 1) return out.fill(src[src.length - 1]);
  const k = (src.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) {
    const p = i * k;
    const j = Math.floor(p);
    out[i] = j + 1 < src.length ? src[j] + (src[j + 1] - src[j]) * (p - j) : src[src.length - 1];
  }
  return out;
}

/**
 * Série affichée qui glisse vers `target` (ease-out cubique) à chaque changement.
 * Une nouvelle cible en cours de route repart de la forme affichée : pas de saut pendant un glisser.
 * Jouée même si le téléphone demande de réduire les animations (souvent activé par l'économie
 * d'énergie) : mouvement court, déclenché par l'utilisateur.
 */
export function useTweenArray(target, { duration = 450, grow = true } = {}) {
  const shown = useRef(null);
  if (shown.current === null) shown.current = grow ? target.map(() => 0) : target;
  const [, bump] = useState(0);

  useEffect(() => {
    const from = resample(shown.current, target.length);
    if (from.every((v, i) => v === target[i])) {
      if (shown.current !== target) {
        shown.current = target;
        bump((n) => n + 1);
      }
      return undefined;
    }
    return animate(duration, (t) => {
      const e = 1 - (1 - t) ** 3;
      shown.current = t >= 1 ? target : target.map((v, i) => from[i] + (v - from[i]) * e);
      bump((n) => n + 1);
    });
  }, [target, duration]);

  return shown.current;
}
