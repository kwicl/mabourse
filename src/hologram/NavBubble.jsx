import { useEffect, useLayoutEffect, useRef } from 'react';
import './nav-bubble.css';

/*
 * Bulle d'eau de la barre de navigation mobile.
 * Ressort amorti calculé à la main (requestAnimationFrame) : le projet n'embarque aucune
 * librairie d'animation et on n'en ajoute pas. Seuls transform / opacity sont animés en JS.
 */
const STIFFNESS = 170;
const DAMPING = 14;
const MASS = 1;
// Ressort secondaire de déformation : sous-amorti -> rebond gélatineux ≈ 500 ms à l'arrivée.
const JELLY_K = 260;
const JELLY_C = 9;
const SPEED_REF = 900; // px/s pour une déformation maximale
const W = 58;
const H = 46;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function NavBubble({ navRef, activeId }) {
  const outer = useRef(null);
  const deform = useRef(null);
  const shine = useRef(null);
  const s = useRef({ x: 0, y: 0, baseY: 0, v: 0, target: 0, from: 0, j: 0, jv: 0, raf: 0, last: 0, ready: false });

  const render = () => {
    const st = s.current;
    if (outer.current) outer.current.style.transform = `translate3d(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px, 0)`;
    const sx = 1 + 0.35 * st.j;
    const sy = 1 - 0.15 * st.j;
    if (deform.current) deform.current.style.transform = `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
    // Le reflet glisse légèrement à l'opposé du déplacement
    if (shine.current) shine.current.style.transform = `translate3d(${(-clamp(st.v / SPEED_REF, -1, 1) * 6).toFixed(2)}px, 0, 0)`;
  };

  const tick = (now) => {
    const st = s.current;
    let dt = Math.min((now - st.last) / 1000, 1 / 30);
    st.last = now;
    // Deux sous-pas pour rester stable même si une frame est longue
    for (let i = 0; i < 2; i++) {
      const h = dt / 2;
      const a = (-STIFFNESS * (st.x - st.target) - DAMPING * st.v) / MASS;
      st.v += a * h;
      st.x += st.v * h;
      const goal = clamp(Math.abs(st.v) / SPEED_REF, 0, 1);
      const ja = -JELLY_K * (st.j - goal) - JELLY_C * st.jv;
      st.jv += ja * h;
      st.j = clamp(st.j + st.jv * h, -0.4, 1);
    }
    // Petit arc flottant (4 à 8 px) pendant le trajet
    const dist = Math.abs(st.target - st.from);
    const progress = dist > 1 ? clamp(1 - Math.abs(st.target - st.x) / dist, 0, 1) : 1;
    const arc = clamp(dist / 30, 4, 8);
    st.y = st.baseY - Math.sin(progress * Math.PI) * arc;
    render();

    const settled = Math.abs(st.x - st.target) < 0.3 && Math.abs(st.v) < 4 && Math.abs(st.j) < 0.004 && Math.abs(st.jv) < 0.02;
    if (settled) {
      st.x = st.target;
      st.y = st.baseY;
      st.v = st.j = st.jv = 0;
      render();
      st.raf = 0;
    } else {
      st.raf = requestAnimationFrame(tick);
    }
  };

  const goTo = (snap) => {
    const nav = navRef.current;
    const el = nav?.querySelector(`[data-nav-id="${activeId}"]`);
    if (outer.current) outer.current.dataset.hidden = el ? 'false' : 'true';
    if (!el) return;
    const st = s.current;
    st.target = el.offsetLeft + el.offsetWidth / 2 - W / 2;
    st.baseY = el.offsetTop + el.offsetHeight / 2 - H / 2;
    if (snap || !st.ready || reducedMotion()) {
      cancelAnimationFrame(st.raf);
      st.raf = 0;
      st.x = st.from = st.target;
      st.y = st.baseY;
      st.v = st.j = st.jv = 0;
      st.ready = true;
      render();
      return;
    }
    // Interruptible : on repart de la position et de la vitesse courantes (inertie conservée)
    st.from = st.x;
    if (!st.raf) {
      st.last = performance.now();
      st.raf = requestAnimationFrame(tick);
    }
  };

  useLayoutEffect(() => {
    goTo(false);
  }, [activeId]);

  // Toujours la dernière version de goTo (onglet actif courant) pour les écouteurs globaux
  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  useEffect(() => {
    const onResize = () => goToRef.current(true);
    window.addEventListener('resize', onResize);
    // Les polices peuvent modifier la largeur des onglets après le premier rendu (une seule fois)
    document.fonts?.ready.then(onResize).catch(() => {});
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(s.current.raf);
    };
  }, []);

  return (
    <span ref={outer} className="nav-bubble" aria-hidden="true" style={{ width: W, height: H }}>
      <span ref={deform} className="nav-bubble__deform">
        <span className="nav-bubble__body">
          <span ref={shine} className="nav-bubble__shine" />
        </span>
      </span>
    </span>
  );
}
