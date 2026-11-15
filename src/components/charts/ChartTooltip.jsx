import { money, signedMoney } from '../../utils/format';
import Amount from '../ui/Amount';
import { useChartTheme } from '../../hooks/useChartTheme';

// Les séries en dégradé exposent "url(#…)" : on retombe sur la couleur sémantique du thème.
const dotColor = (p, colors, t) =>
  colors?.[p.dataKey] ??
  (String(p.color).startsWith('url') || p.color === 'transparent'
    ? { income: t.income, expense: t.expense, balance: t.ink }[p.dataKey]
    : p.color || p.payload?.color);

// Montant du jour affiché sous la valeur cumulée (graphique d'évolution)
const DAY = {
  balance: (d) => (d.dayNet != null ? signedMoney(d.dayNet) : null),
  income: (d) => (d.dayIncome ? `+${money(d.dayIncome)}` : null),
  expense: (d) => (d.dayExpense ? `−${money(d.dayExpense)}` : null),
  saving: (d) => (d.dayIncome || d.dayExpense ? signedMoney(d.dayIncome - d.dayExpense) : null),
};

/** Infobulle commune à tous les graphiques. */
export default function ChartTooltip({ active, payload, label, labelFormatter, colors, masked = [] }) {
  const t = useChartTheme();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line surface-second px-3.5 py-2.5 text-xs shadow-lift backdrop-blur-md">
      {label !== undefined && (
        <div className="mb-1.5 font-medium text-fg-muted">{labelFormatter ? labelFormatter(label) : label}</div>
      )}
      {payload.map((p) => {
        const hide = masked.includes(p.dataKey);
        const day = hide ? '••••' : colors && DAY[p.dataKey]?.(p.payload);
        return (
          <div key={p.dataKey ?? p.name} className="flex items-center gap-2 py-px">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor(p, colors, t) }} />
            {payload.length > 1 && <span className="text-fg-muted">{p.name}</span>}
            <span className="serif ml-auto text-[15px]"><Amount value={p.value} hidden={hide} /></span>
            {colors && <span className="num w-[86px] text-right text-[11px] text-fg-muted">{day ?? '—'}</span>}
          </div>
        );
      })}
    </div>
  );
}
