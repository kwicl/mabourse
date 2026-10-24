import { money, signedMoney } from '../../utils/format';
import Amount from '../ui/Amount';

// Les séries en dégradé exposent "url(#…)" : on retombe sur la couleur sémantique.
const SERIES = { income: '#6F7F55', expense: '#C2603F', balance: '#CC5A37' };
const dotColor = (p, colors) =>
  colors?.[p.dataKey] ??
  (String(p.color).startsWith('url') || p.color === 'transparent' ? SERIES[p.dataKey] : p.color || p.payload?.color);

// Montant du jour affiché sous la valeur cumulée (graphique d'évolution)
const DAY = {
  balance: (d) => (d.dayNet != null ? signedMoney(d.dayNet) : null),
  income: (d) => (d.dayIncome ? `+${money(d.dayIncome)}` : null),
  expense: (d) => (d.dayExpense ? `−${money(d.dayExpense)}` : null),
};

/** Infobulle commune à tous les graphiques. */
export default function ChartTooltip({ active, payload, label, labelFormatter, colors, masked = [] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-sand-line bg-cream/95 px-3.5 py-2.5 text-xs shadow-lift backdrop-blur-md dark:border-night-line dark:bg-night-card/95">
      {label !== undefined && (
        <div className="mb-1.5 font-medium text-ink-500 dark:text-ink-400">{labelFormatter ? labelFormatter(label) : label}</div>
      )}
      {payload.map((p) => {
        const hide = masked.includes(p.dataKey);
        const day = hide ? '••••' : colors && DAY[p.dataKey]?.(p.payload);
        return (
          <div key={p.dataKey ?? p.name} className="flex items-center gap-2 py-px">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor(p, colors) }} />
            {payload.length > 1 && <span className="text-ink-500 dark:text-ink-400">{p.name}</span>}
            <span className="serif ml-auto text-[15px]"><Amount value={p.value} hidden={hide} /></span>
            {colors && <span className="num w-[86px] text-right text-[11px] text-ink-400">{day ?? '—'}</span>}
          </div>
        );
      })}
    </div>
  );
}
