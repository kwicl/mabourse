import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Wallet } from 'lucide-react';
import Amount from './ui/Amount';
import { useFinance } from '../context/FinanceContext';
import { usePeriod } from '../hooks/usePeriod';
import { totalsBetween } from '../utils/stats';
import './spent-banner.css';

/*
 * Mini-fenêtre 3D « consommé sur la période », au-dessus de toute l'app.
 *  - ancrée en haut au centre par défaut, elle se déplace au doigt, à la souris ou aux flèches ;
 *  - lâchée près du haut au centre (ou touche Début), elle se ré-ancre ;
 *  - pendant une saisie, elle se réduit et remonte en haut (spent-banner.css).
 * Position = fractions de l'espace libre : toujours à l'écran, quels que soient l'écran et le montant.
 */

const POS_KEY = 'mabourse-spent-position';
const EDGE = 8; // = --spent-edge
const SNAP = 36;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function readPosition() {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY));
    if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) return { x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1) };
  } catch {
    /* stockage indisponible */
  }
  return null; // ancrée
}

function savePosition(position) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(position));
  } catch {
    /* stockage indisponible */
  }
}

/** iOS déplace la zone visible quand le clavier s'ouvre : le bandeau et la saisie la suivent. */
function useVisibleViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const { style } = document.documentElement;
    const sync = () => {
      style.setProperty('--vv-top', `${Math.max(0, vv.offsetTop)}px`);
      style.setProperty('--vv-height', `${vv.height}px`);
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      style.removeProperty('--vv-top');
      style.removeProperty('--vv-height');
    };
  }, []);
}

export default function SpentBanner() {
  const { transactions } = useFinance();
  const { period, range } = usePeriod(transactions);
  const spent = useMemo(() => totalsBetween(transactions, range.from, range.to).expense, [transactions, range]);
  const [position, setPosition] = useState(readPosition);
  const [moving, setMoving] = useState(null); // { x, y, tilt, snap } pendant un glisser
  const el = useRef(null);
  const drag = useRef(null);
  useVisibleViewport();

  // Espace libre, mêmes bornes que le CSS
  const room = () => {
    const { offsetWidth: w, offsetHeight: h } = el.current;
    const { clientWidth, clientHeight } = document.documentElement;
    const bottom = parseFloat(getComputedStyle(el.current).getPropertyValue('--spent-bottom'));
    return { w: Math.max(1, clientWidth - EDGE * 2 - w), h: Math.max(1, clientHeight - EDGE - bottom - h) };
  };

  const place = (next) => {
    setPosition(next);
    savePosition(next);
  };

  const down = (e) => {
    if (e.button !== 0) return;
    const box = el.current.getBoundingClientRect();
    el.current.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - box.left, dy: e.clientY - box.top, x0: e.clientX, y0: e.clientY, last: e.clientX, next: null };
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    if (!d.next && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 5) return; // simple toucher
    const free = room();
    const x = clamp((e.clientX - d.dx - EDGE) / free.w, 0, 1);
    const y = clamp((e.clientY - d.dy - EDGE) / free.h, 0, 1);
    d.next = {
      x,
      y,
      tilt: clamp((e.clientX - d.last) * 2, -22, 22),
      snap: y * free.h < SNAP && Math.abs(x - 0.5) * free.w < SNAP,
    };
    d.last = e.clientX;
    setMoving(d.next);
  };

  const release = () => {
    const next = drag.current?.next;
    drag.current = null;
    setMoving(null);
    if (next) place(next.snap ? null : { x: next.x, y: next.y });
  };

  const onKey = (e) => {
    if (e.key === 'Home') {
      e.preventDefault();
      place(null);
      return;
    }
    const step = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[e.key];
    if (!step) return;
    e.preventDefault();
    const free = room();
    const p = position ?? { x: 0.5, y: 0 };
    place({ x: clamp(p.x + step[0] / free.w, 0, 1), y: clamp(p.y + step[1] / free.h, 0, 1) });
  };

  const shown = moving ?? position;
  const classes = ['spent', !position && 'is-docked', shown && 'is-floating', moving && 'is-moving', moving?.snap && 'will-snap'];

  return createPortal(
    <div
      ref={el}
      className={classes.filter(Boolean).join(' ')}
      style={shown ? { '--x': shown.x, '--y': shown.y, '--tilt': `${moving?.tilt ?? 0}deg` } : undefined}
      role="group"
      tabIndex={0}
      aria-label={`Consommé, ${period.label}. Flèches pour déplacer, Début pour replacer en haut.`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={onKey}
    >
      <div className="spent-slab">
        {/* La pièce fait un tour quand le total change */}
        <span key={spent} className="spent-coin" aria-hidden="true">
          <Wallet strokeWidth={2} />
        </span>
        <span className="spent-text">
          <span className="spent-label">Consommé · {period.label}</span>
          <span className="spent-value">
            <Amount value={spent} animate />
          </span>
        </span>
        <GripVertical className="spent-grip" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
