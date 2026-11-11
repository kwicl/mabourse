import { useEffect, useRef, useState } from 'react';
import { moneyParts, signedMoney } from '../../utils/format';
import { cashPending } from '../../utils/cashRegister';

const DURATION = 1100;

/**
 * Montant avec devise plus petite et grise (« 327 773,0 MAD »).
 * `sign` préfixe (+ / −) ; `hidden` masque le chiffre (solde caché).
 * `animate` : après un enregistrement, le chiffre défile comme une caisse jusqu'au nouveau total.
 */
export default function Amount({ value, sign = '', hidden = false, className = '', animate = false }) {
  const [shown, setShown] = useState(value);
  const [delta, setDelta] = useState(null);
  const prev = useRef(value);
  const raf = useRef(0);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (!animate || from === value || !cashPending() || !Number.isFinite(from) || !Number.isFinite(value)) {
      cancelAnimationFrame(raf.current);
      setShown(value);
      return undefined;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return undefined;
    }
    setDelta({ v: value - from, key: Date.now() });
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / DURATION);
      // Paliers comme les rouleaux d'une caisse mécanique
      const stepped = Math.round((1 - Math.pow(1 - p, 3)) * 24) / 24;
      setShown(from + (value - from) * stepped);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    const t = setTimeout(() => setDelta(null), 1900);
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(t);
    };
  }, [value, animate]);

  const { number, currency } = moneyParts(animate ? shown : value);
  const rolling = animate && shown !== value;
  return (
    <span className={`relative whitespace-nowrap ${className}`}>
      <span className={rolling ? 'cash-rolling' : ''}>{hidden ? '••••••' : `${sign}${number}`}</span>
      <span className="ml-[0.25em] font-sans text-[0.55em] font-medium tracking-wide text-ink-400 dark:text-ink-500">{currency}</span>
      {delta && !hidden && (
        <span key={delta.key} className="cash-delta" aria-hidden="true">
          {signedMoney(delta.v)}
        </span>
      )}
    </span>
  );
}
