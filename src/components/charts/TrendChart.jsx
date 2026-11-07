import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { niceTicks, seriesColors } from './BalanceChart';
import { useChartTheme } from '../../hooks/useChartTheme';
import { compact, dayLabel } from '../../utils/format';

/**
 * Tendance cumulée jour par jour : revenus, dépenses et épargne (revenus − dépenses) depuis le début de la période.
 * Une seule échelle : l'écart entre les deux courbes est l'épargne. `data` : lignes de seriesBetween + `saving`.
 * `visible` = { income, expense, saving } ; `masked` = séries dont les montants sont cachés.
 */
export default function TrendChart({ data, visible = { income: true, expense: true, saving: true }, masked = [], height = 280 }) {
  const t = useChartTheme();
  const colors = seriesColors(t);

  const keys = ['income', 'expense', 'saving'].filter((k) => visible[k]);
  const values = data.flatMap((d) => keys.map((k) => d[k] ?? 0));
  const { domain, ticks } = niceTicks(Math.min(0, ...values), Math.max(0, ...values));
  // Une échelle commune dévoile les revenus : masquée dès qu'une série privée est affichée
  const hideAxis = keys.some((k) => masked.includes(k));

  const dot = (color) => ({ r: 4.5, strokeWidth: 3, stroke: t.surface, fill: color });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="savingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.saving} stopOpacity={t.dark ? 0.2 : 0.16} />
            <stop offset="100%" stopColor={colors.saving} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="2 6" />
        <XAxis dataKey="date" tickFormatter={dayLabel} minTickGap={32} dy={8} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          hide={hideAxis}
          domain={domain}
          ticks={ticks}
          tickFormatter={compact}
          width={44}
          tick={{ fill: t.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip labelFormatter={dayLabel} colors={colors} masked={masked} />} cursor={{ stroke: t.cursor, strokeDasharray: '4 4' }} />
        {visible.saving && <ReferenceLine y={0} stroke={t.cursor} />}

        {visible.saving && (
          <Area
            type="monotone"
            dataKey="saving"
            name="Épargne"
            stroke={colors.saving}
            strokeWidth={2.5}
            fill="url(#savingFill)"
            activeDot={dot(colors.saving)}
            animationDuration={700}
          />
        )}
        {visible.income && (
          <Line type="monotone" dataKey="income" name="Revenus" stroke={colors.income} strokeWidth={2.5} strokeLinecap="round" dot={false} activeDot={dot(colors.income)} animationDuration={700} />
        )}
        {visible.expense && (
          <Line type="monotone" dataKey="expense" name="Dépenses" stroke={colors.expense} strokeWidth={2.5} strokeLinecap="round" dot={false} activeDot={dot(colors.expense)} animationDuration={700} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
