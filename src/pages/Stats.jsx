import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../components/ui/Card';
import Segmented from '../components/ui/Segmented';
import MonthPicker from '../components/MonthPicker';
import MonthlyBars from '../components/charts/MonthlyBars';
import CategoryDonut from '../components/charts/CategoryDonut';
import CategoryIcon from '../components/ui/CategoryIcon';
import { useFinance } from '../context/FinanceContext';
import { useChartTheme } from '../hooks/useChartTheme';
import { byCategory, monthlySeries, shiftMonth } from '../utils/stats';
import { monthKey, monthLabel, pct, todayISO } from '../utils/format';
import Amount from '../components/ui/Amount';

function SavingsRate({ data }) {
  const t = useChartTheme();
  const rows = data.map((d) => ({ key: d.key, rate: d.income ? Math.round((d.net / d.income) * 1000) / 10 : 0 }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={rows} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.income} stopOpacity={0.3} />
            <stop offset="100%" stopColor={t.income} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="2 6" />
        <XAxis dataKey="key" tickFormatter={(k) => monthLabel(k)} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
        <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          cursor={{ stroke: t.cursor, strokeDasharray: '4 4' }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-xl border border-sand-line bg-cream/95 px-3.5 py-2.5 text-xs shadow-lift backdrop-blur-md dark:border-night-line dark:bg-night-card/95">
                <div className="mb-1 capitalize text-ink-500 dark:text-ink-400">{monthLabel(label, 'long')}</div>
                <div className="serif text-[15px]">{payload[0].value} % épargné</div>
              </div>
            ) : null
          }
        />
        <Area type="monotone" dataKey="rate" stroke={t.income} strokeWidth={2} fill="url(#rateFill)" dot={{ r: 3, fill: t.income, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Stats() {
  const { transactions, categories } = useFinance();
  const [count, setCount] = useState(6);
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [type, setType] = useState('expense');

  const series = useMemo(() => monthlySeries(transactions, count), [transactions, count]);
  const cats = useMemo(() => byCategory(transactions, categories, month, type), [transactions, categories, month, type]);
  const prevCats = useMemo(
    () => Object.fromEntries(byCategory(transactions, categories, shiftMonth(month, -1), type).map((c) => [c.id, c.value])),
    [transactions, categories, month, type],
  );

  const avg = (k) => series.reduce((s, d) => s + d[k], 0) / (series.length || 1);
  const best = series.reduce((b, d) => (d.net > (b?.net ?? -Infinity) ? d : b), null);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          ['Revenu moyen', <Amount value={avg('income')} />, 'text-income'],
          ['Dépense moyenne', <Amount value={avg('expense')} />, 'text-expense'],
          ['Épargne moyenne', <Amount value={avg('net')} />, ''],
          ['Meilleur mois', best ? monthLabel(best.key, 'long') : '—', 'capitalize'],
        ].map(([label, value, cls], i) => (
          <div key={label} className="glass glass-hover animate-fade-up p-5 sm:p-6" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="label">{label}</span>
            <div className={`serif mt-3 truncate text-[22px] sm:text-[30px] ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      <Card
        title="Revenus vs dépenses"
        subtitle="Comparaison mois par mois"
        action={
          <Segmented
            size="sm"
            value={count}
            onChange={setCount}
            options={[
              { value: 3, label: '3M' },
              { value: 6, label: '6M' },
              { value: 12, label: '12M' },
            ]}
          />
        }
      >
        <MonthlyBars data={series} height={300} />
        <div className="mt-3 flex justify-center gap-5 text-xs text-ink-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-income" />Revenus</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-expense" />Dépenses</span>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card
          title="Répartition détaillée"
          action={
            <Segmented
              size="sm"
              value={type}
              onChange={setType}
              options={[
                { value: 'expense', label: 'Dépenses' },
                { value: 'income', label: 'Revenus' },
              ]}
            />
          }
        >
          <div className="mb-5">
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <CategoryDonut data={cats} limit={8} height={230} />
        </Card>

        <Card title="Taux d'épargne" subtitle="Part des revenus conservée">
          <SavingsRate data={series} />
        </Card>
      </div>

      <Card title="Comparaison par catégorie" subtitle={`${monthLabel(month, 'long')} vs ${monthLabel(shiftMonth(month, -1), 'long')}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="label pb-3 font-medium">Catégorie</th>
                <th className="label pb-3 text-right font-medium">Mois précédent</th>
                <th className="label pb-3 text-right font-medium">Ce mois</th>
                <th className="label pb-3 text-right font-medium">Variation</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => {
                const prev = prevCats[c.id] || 0;
                const diff = prev ? (c.value - prev) / prev : NaN;
                const up = diff > 0;
                const good = type === 'expense' ? !up : up;
                return (
                  <tr key={c.id} className="border-t border-sand-line transition-colors duration-300 hover:bg-sand/30 dark:border-night-line dark:hover:bg-white/[0.02]">
                    <td className="py-2.5">
                      <span className="flex items-center gap-3">
                        <CategoryIcon icon={c.icon} color={c.color} size={30} />
                        {c.name}
                      </span>
                    </td>
                    <td className="num py-2.5 text-right text-ink-400"><Amount value={prev} /></td>
                    <td className="num py-2.5 text-right font-medium"><Amount value={c.value} /></td>
                    <td className={`num py-2.5 text-right ${Number.isFinite(diff) ? (good ? 'text-income' : 'text-expense') : 'text-ink-400'}`}>
                      {Number.isFinite(diff) ? pct(diff) : 'nouveau'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!cats.length && <p className="py-8 text-center text-sm text-ink-400">Aucune donnée pour ce mois.</p>}
        </div>
      </Card>
    </div>
  );
}
