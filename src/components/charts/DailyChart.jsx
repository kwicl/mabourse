import { Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { niceTicks, seriesColors } from './BalanceChart';
import { useChartTheme } from '../../hooks/useChartTheme';
import { compact, dayLabel } from '../../utils/format';

/**
 * Dépenses de chaque jour (sans cumul), en barres.
 * `data` : [{ date, expense }].
 */
export default function DailyChart({ data, height = 280 }) {
  const t = useChartTheme();
  const { expense: color } = seriesColors(t);
  const { domain, ticks } = niceTicks(0, Math.max(0, ...data.map((d) => d.expense ?? 0)), true);
  // Beaucoup de jours : barres plus fines, sans arrondi
  const many = data.length > 45;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }} barCategoryGap={many ? '10%' : '24%'}>
        <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="2 6" />
        <XAxis dataKey="date" tickFormatter={dayLabel} minTickGap={32} dy={8} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={domain} ticks={ticks} tickFormatter={compact} width={44} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip labelFormatter={dayLabel} />} cursor={{ fill: t.cursor, opacity: 0.25 }} />
        <Bar dataKey="expense" name="Dépenses" fill={color} radius={many ? 0 : [4, 4, 0, 0]} maxBarSize={28} animationDuration={600} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
