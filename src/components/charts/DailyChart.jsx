import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { niceTicks, seriesColors } from './BalanceChart';
import { useChartTheme } from '../../hooks/useChartTheme';
import { compact, dayLabel } from '../../utils/format';

/**
 * Vue quotidienne (sans cumul) : dépenses et revenus de chaque jour en barres,
 * budget quotidien en ligne pointillée (budgets mensuels ÷ nombre de jours du mois).
 * `data` : [{ date, expense, income, budget }] ; `visible` = { expense, income, budget }.
 */
export default function DailyChart({ data, visible = { expense: true, income: true, budget: true }, masked = [], height = 280 }) {
  const t = useChartTheme();
  const colors = { ...seriesColors(t), budget: seriesColors(t).balance };

  const keys = ['expense', 'income', 'budget'].filter((k) => visible[k]);
  const values = data.flatMap((d) => keys.map((k) => d[k] ?? 0));
  const { domain, ticks } = niceTicks(0, Math.max(0, ...values), true);
  const hideAxis = keys.some((k) => masked.includes(k));
  // Beaucoup de jours : barres plus fines, sans arrondi
  const many = data.length > 45;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }} barGap={1} barCategoryGap={many ? '10%' : '24%'}>
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
        <Tooltip content={<ChartTooltip labelFormatter={dayLabel} masked={masked} />} cursor={{ fill: t.cursor, opacity: 0.25 }} />
        {visible.expense && (
          <Bar dataKey="expense" name="Dépenses" fill={colors.expense} radius={many ? 0 : [4, 4, 0, 0]} maxBarSize={22} animationDuration={600} />
        )}
        {visible.income && (
          <Bar dataKey="income" name="Revenus" fill={colors.income} radius={many ? 0 : [4, 4, 0, 0]} maxBarSize={22} animationDuration={600} />
        )}
        {visible.budget && data.some((d) => d.budget > 0) && (
          <Line
            type="stepAfter"
            dataKey="budget"
            name="Budget / jour"
            stroke={colors.budget}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={false}
            animationDuration={600}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
