import { moneyParts } from '../../utils/format';

/**
 * Montant avec devise plus petite et grise (« 327 773,0 MAD »).
 * `sign` préfixe (+ / −) ; `hidden` masque le chiffre (solde caché).
 */
export default function Amount({ value, sign = '', hidden = false, className = '' }) {
  const { number, currency } = moneyParts(value);
  return (
    <span className={`whitespace-nowrap ${className}`}>
      {hidden ? '••••••' : `${sign}${number}`}
      <span className="ml-[0.25em] font-sans text-[0.55em] font-medium tracking-wide text-ink-400 dark:text-ink-500">{currency}</span>
    </span>
  );
}
