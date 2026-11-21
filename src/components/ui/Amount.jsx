import { useEffect, useRef, useState } from 'react';
import { moneyParts, signedMoney } from '../../utils/format';
import { cashPending } from '../../utils/cashRegister';

const DURATION = 1100;
const TWEEN = 550;

/**
 * Montant avec devise plus petite et grise (« 327 773,0 MAD »).
 * `sign` préfixe (+ / −) ; `hidden` masque le chiffre (solde caché).
 * `animate` : le chiffre glisse vers sa nouvelle valeur.
 *   - juste après un enregistrement : il défile comme une caisse (paliers + montant ajouté qui s'envole) ;
 *   - sinon (changement de période…) : il compte en douceur depuis la valeur affichée.
 *   Joué même si le téléphone demande de réduire les animations (souvent activé par l'économie d'énergie).
 */
export default function Amount({ value, sign = '', hidden = false, className = '', animate = false }) {
  const [shown, setShown] = useState(value);
  const [delta, setDelta] = useState(null);
  const [cash, setCash] = useState(false);
  const current = useRef(value); // valeur affichée à l'instant (point de départ d'une nouvelle animation)
  const raf = useRef(0);

  useEffect(() => {
    const from = current.current;
    cancelAnimationFrame(raf.current);
    const settle = () => {
      current.current = value;
      setShown(value);
      setCash(false);
    };
    if (!animate || from === value || hidden || !Number.isFinite(from) || !Number.isFinite(value)) {
      settle();
      return undefined;
    }
    const register = cashPending();
    setCash(register);
    const duration = register ? DURATION : TWEEN;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      // Caisse : paliers comme les rouleaux d'une caisse mécanique ; période : glissement continu
      const k = register ? Math.round(eased * 24) / 24 : eased;
      const v = p >= 1 ? value : from + (value - from) * k;
      current.current = v;
      setShown(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setCash(false);
    };
    raf.current = requestAnimationFrame(tick);
    if (!register) return () => cancelAnimationFrame(raf.current);
    setDelta({ v: value - from, key: Date.now() });
    const t = setTimeout(() => setDelta(null), 1900);
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(t);
    };
  }, [value, animate, hidden]);

  const { number, currency } = moneyParts(animate ? shown : value);
  const rolling = animate && cash && shown !== value;
  return (
    <span className={`relative whitespace-nowrap ${className}`}>
      <span className={rolling ? 'cash-rolling' : ''}>{hidden ? '••••••' : `${sign}${number}`}</span>
      <span className="ml-[0.25em] font-sans text-[0.55em] font-medium tracking-wide text-fg-muted">{currency}</span>
      {delta && !hidden && (
        <span key={delta.key} className="cash-delta" aria-hidden="true">
          {signedMoney(delta.v)}
        </span>
      )}
    </span>
  );
}
