import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { todayISO } from '../utils/format';
import { useTweenArray } from '../hooks/useTween';

/**
 * Frise de la période : les dépenses des 12 derniers mois (somme glissante sur 7 jours) dessinées
 * en relief ; la période choisie est une fenêtre éclairée. On tire une poignée pour changer une borne,
 * on fait glisser la fenêtre pour la déplacer, on clique ailleurs pour l'y centrer (souris).
 * Quand la période change par un préréglage, la fenêtre et les poignées glissent jusqu'à leur place
 * et le relief se redessine en douceur.
 */

const DAY = 86400000;
const TRACK = 56;
const MIN_SPAN = 1;
const at = (iso) => new Date(`${iso}T12:00:00`);
const isoOf = (d) => d.toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = at(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d);
};
const diff = (a, b) => Math.round((at(b) - at(a)) / DAY);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const shortDate = (iso) => at(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const monthName = (d) => d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, Math.round(width)];
}

export default function PeriodTimeline({ from, to, transactions, onChange }) {
  const [ref, width] = useWidth();
  const drag = useRef(null);
  const [dragging, setDragging] = useState(null); // 'start' | 'end' | 'pan' | null
  const [frozen, setFrozen] = useState(null); // domaine figé pendant un glisser

  // Domaine : 12 derniers mois, élargi si la période commence avant (ex. « Tout »)
  const today = todayISO();
  const yearStart = addDays(isoOf(new Date(at(today).setFullYear(at(today).getFullYear() - 1))), 1);
  const domain = frozen ?? { start: from < yearStart ? from : yearStart, end: to > today ? to : today };
  const { start, end } = domain;
  const N = diff(start, end) + 1;

  // Dépenses sur 7 jours glissants, jour par jour
  const shape = useMemo(() => {
    const day = new Array(N).fill(0);
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.date || t.date < start || t.date > end) continue;
      day[diff(start, t.date)] += Number(t.amount) || 0;
    }
    const out = new Array(N);
    let sum = 0;
    for (let i = 0; i < N; i++) {
      sum += day[i] - (i >= 7 ? day[i - 7] : 0);
      out[i] = sum;
    }
    return out;
  }, [transactions, start, end, N]);
  const anim = useTweenArray(shape, { duration: 600 });
  const peak = Math.max(1, ...anim);

  const a = clamp(diff(start, from), 0, N - 1);
  const b = clamp(diff(start, to), a, N - 1);
  const px = (off) => (off / N) * width;
  const left = px(a);
  const selWidth = Math.max(4, px(b + 1) - left);

  const area =
    `M0,${TRACK}` +
    anim.map((v, i) => `L${(((i + 0.5) / anim.length) * width).toFixed(1)},${(TRACK - 3 - (v / peak) * (TRACK - 14)).toFixed(1)}`).join('') +
    `L${width},${TRACK}Z`;

  // Début de chaque mois du domaine (repères + libellés)
  const months = useMemo(() => {
    const list = [];
    for (let i = 0; i < N; i++) {
      const iso = addDays(start, i);
      if (i === 0 || iso.endsWith('-01')) list.push({ off: i, date: at(iso) });
    }
    return list;
  }, [start, N]);

  const emit = (na, nb) => {
    if (na !== a || nb !== b) onChange(addDays(start, na), addDays(start, nb));
  };

  const dayAt = (clientX) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return 0;
    return clamp(Math.floor(((clientX - box.left) / box.width) * N), 0, N - 1);
  };

  const grab = (mode, e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, grab: dayAt(e.clientX) - (mode === 'end' ? b : a), span: b - a };
    setFrozen(domain);
    setDragging(mode);
  };

  const begin = (mode) => (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    grab(mode, e);
  };

  // Clic sur le relief (souris) : la fenêtre s'y centre, puis suit le pointeur
  const jump = (e) => {
    if (e.button !== 0 || e.pointerType === 'touch') return;
    const span = b - a;
    const day = dayAt(e.clientX);
    const s = clamp(day - Math.floor(span / 2), 0, N - 1 - span);
    grab('pan', e);
    drag.current.grab = day - s;
    emit(s, s + span);
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const day = dayAt(e.clientX) - d.grab;
    if (d.mode === 'start') emit(clamp(day, 0, b - MIN_SPAN + 1), b);
    else if (d.mode === 'end') emit(a, clamp(day, a + MIN_SPAN - 1, N - 1));
    else {
      const s = clamp(day, 0, N - 1 - d.span);
      emit(s, s + d.span);
    }
  };

  const release = () => {
    drag.current = null;
    setDragging(null);
    setFrozen(null);
  };

  const onKey = (which) => (e) => {
    const steps = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -30, PageUp: 30, Home: -N, End: N };
    let step = steps[e.key];
    if (!step) return;
    e.preventDefault();
    if (e.shiftKey && Math.abs(step) === 1) step *= 7;
    if (which === 'start') emit(clamp(a + step, 0, b - MIN_SPAN + 1), b);
    else emit(a, clamp(b + step, a + MIN_SPAN - 1, N - 1));
  };

  const glide = dragging ? '' : ' tl-glide';

  const handle = (which) => {
    const x = which === 'start' ? left : left + selWidth;
    const iso = which === 'start' ? from : to;
    return (
      <div
        role="slider"
        tabIndex={0}
        aria-label={which === 'start' ? 'Premier jour de la période' : 'Dernier jour de la période'}
        aria-valuemin={which === 'start' ? 0 : a}
        aria-valuemax={which === 'start' ? b : N - 1}
        aria-valuenow={which === 'start' ? a : b}
        aria-valuetext={at(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        onKeyDown={onKey(which)}
        onPointerDown={begin(which)}
        className={`tl-handle group${glide}${dragging === which ? ' on' : ''}`}
        style={{ transform: `translateX(${x - 16}px)` }}
      >
        <span className="tl-grip" />
        <span className="tl-bubble">{shortDate(iso)}</span>
      </div>
    );
  };

  return (
    <div className="tl select-none pt-7">
      <div
        ref={ref}
        className="tl-track"
        style={{ height: TRACK }}
        onPointerDown={jump}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        {width > 0 && (
          <>
            <svg width={width} height={TRACK} className="absolute inset-0" aria-hidden="true">
              <path d={area} className="tl-dim" />
            </svg>

            <div
              onPointerDown={begin('pan')}
              className={`tl-sel${glide}${dragging === 'pan' ? ' on' : ''}`}
              style={{ width: selWidth, transform: `translateX(${left}px)` }}
            >
              <svg width={width} height={TRACK} className={`tl-sel-svg${glide}`} style={{ transform: `translateX(${-left}px)` }} aria-hidden="true">
                <path d={area} className="tl-lit" />
              </svg>
            </div>

            <svg width={width} height={TRACK} className="pointer-events-none absolute inset-0" aria-hidden="true">
              {months.map((m) => (
                <line key={m.off} x1={px(m.off)} x2={px(m.off)} y1={TRACK - 6} y2={TRACK} className="tl-tick" />
              ))}
            </svg>

            {handle('start')}
            {handle('end')}
          </>
        )}
      </div>

      <div className="relative mt-1.5 h-4" aria-hidden="true">
        {months.map((m, i) => {
          const next = months[i + 1]?.off ?? N;
          const space = px(next - m.off);
          const name = monthName(m.date);
          const label = width < 520 ? name[0].toUpperCase() : m.date.getMonth() === 0 && space > 60 ? `${name} ${m.date.getFullYear()}` : name;
          if (space < label.length * 6.5 + 2) return null;
          return (
            <span key={m.off} className="tl-month" style={{ left: px((m.off + next) / 2) }}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
