import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { useChartTheme } from '../../hooks/useChartTheme';
import { compact, monthLabel } from '../../utils/format';

/** Barres revenus vs dépenses par mois. */
export default function MonthlyBars({ data, height = 280 }) {
  const t = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={6} barCategoryGap="28%" margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.incomeSoft} />
            <stop offset="100%" stopColor={t.income} />
          </linearGradient>
          <linearGradient id="barExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.expenseSoft} />
            <stop offset="100%" stopColor={t.expense} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="2 6" />
        <XAxis
          dataKey="key"
          tickFormatter={(k) => monthLabel(k)}
          tick={{ fill: t.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis tickFormatter={compact} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          content={<ChartTooltip labelFormatter={(k) => monthLabel(k, 'long')} />}
          cursor={{ fill: t.dark ? 'rgba(251,249,245,0.04)' : 'rgba(230,224,212,0.45)', radius: 10 }}
        />
        <Bar dataKey="income" name="Revenus" fill="url(#barIncome)" radius={[6, 6, 2, 2]} maxBarSize={22} animationDuration={800} />
        <Bar dataKey="expense" name="Dépenses" fill="url(#barExpense)" radius={[6, 6, 2, 2]} maxBarSize={22} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}
