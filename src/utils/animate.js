const FRAME = 16;
const MAX_STEP = 64;

/**
 * Appelle `onFrame(p)`, p de 0 à 1, sur `duration` ms d'images réellement affichées.
 * Le chrono n'utilise que les horodatages de requestAnimationFrame :
 *  - jamais de temps négatif (l'image peut être datée d'avant le useEffect qui lance l'animation) ;
 *  - un rendu lent (téléphone) compte au plus MAX_STEP ms : l'animation n'est pas sautée ;
 *  - la première image avance déjà : une cible qui change à chaque image (glisser) reste animée.
 * Renvoie la fonction d'annulation.
 */
export function animate(duration, onFrame) {
  let raf = 0;
  let last = null;
  let elapsed = 0;
  const tick = (now) => {
    elapsed += last === null ? FRAME : Math.min(MAX_STEP, Math.max(0, now - last));
    last = now;
    const p = Math.min(1, elapsed / duration);
    onFrame(p);
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
