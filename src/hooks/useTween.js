import { useEffect, useRef, useState } from 'react';

/** Préférence « réduire les animations » du système, suivie en direct. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

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
 */
export function useTweenArray(target, { duration = 450, grow = true } = {}) {
  const reduced = useReducedMotion();
  const shown = useRef(null);
  if (shown.current === null) shown.current = grow && !reduced ? target.map(() => 0) : target;
  const [, bump] = useState(0);

  useEffect(() => {
    const from = resample(shown.current, target.length);
    if (reduced || from.every((v, i) => v === target[i])) {
      if (shown.current !== target) {
        shown.current = target;
        bump((n) => n + 1);
      }
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = 1 - (1 - t) ** 3;
      shown.current = t >= 1 ? target : target.map((v, i) => from[i] + (v - from[i]) * e);
      bump((n) => n + 1);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return shown.current;
}
