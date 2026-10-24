import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { useChartTheme } from '../../hooks/useChartTheme';
import { compact, dayLabel } from '../../utils/format';

// Graduations "rondes" (1, 2, 2.5, 5 × 10^n) couvrant [min, max]
function niceTicks(min, max, from0 = false) {
  if (from0) min = 0;
  const raw = ((max - min) * 1.3 || 1000) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  return { domain: [lo, hi], ticks: Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step) };
}

/** Couleur de chaque série (le solde suit l'encre du thème). */
export function seriesColors(t) {
  return { balance: t.dark ? '#E6E0D4' : '#33302D', income: t.income, expense: t.expense };
}

/**
 * Solde (axe gauche) + revenus / dépenses cumulés (axe droit) sur un même graphique.
 * `visible` = { balance, income, expense }. L'épaisseur de chaque courbe est proportionnelle à son montant.
 */
export default function BalanceChart({ data, visible = { balance: true }, height = 260 }) {
  const t = useChartTheme();
  const colors = seriesColors(t);
  const last = data[data.length - 1] || {};

  // Épaisseur : 1.25px → 4.5px selon le montant de la série par rapport à la plus grande visible
  const amounts = {
    balance: Math.abs(last.balance || 0),
    income: last.income || 0,
    expense: last.expense || 0,
  };
  const maxAmount = Math.max(1, ...Object.keys(amounts).filter((k) => visible[k]).map((k) => amounts[k]));
  const width = (k) => 1.25 + 3.25 * (amounts[k] / maxAmount);

  const bal = data.map((d) => d.balance);
  const left = niceTicks(Math.min(...bal), Math.max(...bal));
  const flowMax = Math.max(visible.income ? last.income || 0 : 0, visible.expense ? last.expense || 0 : 0);
  const right = niceTicks(0, flowMax, true);
  const showFlows = visible.income || visible.expense;

  const dot = (color) => ({ r: 4.5, strokeWidth: 3, stroke: t.surface, fill: color });
  const axis = { tick: { fill: t.axis, fontSize: 11 }, axisLine: false, tickLine: false };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.accentSoft} stopOpacity={t.dark ? 0.18 : 0.14} />
            <stop offset="100%" stopColor={t.accentSoft} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="2 6" />
        <XAxis dataKey="date" tickFormatter={dayLabel} minTickGap={32} dy={8} {...axis} />
        <YAxis yAxisId="balance" hide={!visible.balance} domain={left.domain} ticks={left.ticks} tickFormatter={compact} width={44} {...axis} />
        <YAxis
          yAxisId="flow"
          orientation="right"
          hide={!showFlows}
          domain={right.domain}
          ticks={right.ticks}
          tickFormatter={compact}
          width={44}
          {...axis}
        />
        <Tooltip content={<ChartTooltip labelFormatter={dayLabel} colors={colors} />} cursor={{ stroke: t.cursor, strokeDasharray: '4 4' }} />

        {visible.balance && (
          <Area
            yAxisId="balance"
            type="monotone"
            dataKey="balance"
            name="Solde"
            stroke={colors.balance}
            strokeWidth={width('balance')}
            fill="url(#balanceFill)"
            activeDot={dot(colors.balance)}
            animationDuration={700}
          />
        )}
        {visible.income && (
          <Line
            yAxisId="flow"
            type="monotone"
            dataKey="income"
            name="Revenus"
            stroke={colors.income}
            strokeWidth={width('income')}
            strokeLinecap="round"
            dot={false}
            activeDot={dot(colors.income)}
            animationDuration={700}
          />
        )}
        {visible.expense && (
          <Line
            yAxisId="flow"
            type="monotone"
            dataKey="expense"
            name="Dépenses"
            stroke={colors.expense}
            strokeWidth={width('expense')}
            strokeLinecap="round"
            dot={false}
            activeDot={dot(colors.expense)}
            animationDuration={700}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
