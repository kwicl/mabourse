import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, Wallet } from 'lucide-react';
import Card from '../components/ui/Card';
import KpiCard from '../components/KpiCard';
import BalanceChart, { seriesColors } from '../components/charts/BalanceChart';
import { useChartTheme } from '../hooks/useChartTheme';
import CategoryDonut from '../components/charts/CategoryDonut';
import TransactionList from '../components/transactions/TransactionList';
import BudgetBar from '../components/BudgetBar';
import Segmented from '../components/ui/Segmented';
import { useFinance } from '../context/FinanceContext';
import { navigate } from '../hooks/useHashRoute';
import { accountBalances, byCategory, byCategoryRange, flowSeries, monthTotals, shiftMonth, totalBalance } from '../utils/stats';
import { money, monthKey, signedMoney, todayISO } from '../utils/format';

const change = (cur, prev) => (prev ? (cur - prev) / Math.abs(prev) : NaN);

const SERIES = [
  { key: 'balance', label: 'Solde' },
  { key: 'income', label: 'Revenus' },
  { key: 'expense', label: 'Dépenses' },
];

/** Boutons d'affichage des séries (au moins une reste active). */
function SeriesToggle({ visible, onToggle, totals }) {
  const colors = seriesColors(useChartTheme());
  return (
    <div className="flex flex-wrap gap-2">
      {SERIES.map(({ key, label }) => {
        const on = visible[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            aria-pressed={on}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-out ${
              on
                ? 'border-sand-line bg-white text-ink-900 shadow-soft dark:border-night-line dark:bg-white/[0.06] dark:text-ink-50'
                : 'border-transparent bg-transparent text-ink-400 hover:bg-sand/40 hover:text-ink-700 dark:hover:bg-white/[0.03] dark:hover:text-ink-200'
            }`}
          >
            <span
              className="h-2 w-2 rounded-full transition-opacity duration-300"
              style={{ background: colors[key], opacity: on ? 1 : 0.35 }}
            />
            {label}
            <span className={`serif text-[14px] ${on ? '' : 'opacity-60'}`}>{money(totals[key])}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Dashboard({ onEdit }) {
  const { transactions, categories, accounts, budgets, categoryById } = useFinance();
  const [range, setRange] = useState(30);
  const [visible, setVisible] = useState({ balance: true, income: false, expense: false });
  const toggleSeries = (key) =>
    setVisible((v) => {
      const next = { ...v, [key]: !v[key] };
      return Object.values(next).some(Boolean) ? next : v;
    });

  const m = monthKey(todayISO());
  const s = useMemo(() => {
    const cur = monthTotals(transactions, m);
    const prev = monthTotals(transactions, shiftMonth(m, -1));
    const series = flowSeries(accounts, transactions, range);
    const balance = totalBalance(accounts, transactions);
    const first = series[0]?.balance ?? balance;
    const lastPoint = series[series.length - 1] || {};
    return {
      cur,
      prev,
      series,
      balance,
      delta: balance - first,
      totals: { balance, income: lastPoint.income || 0, expense: lastPoint.expense || 0 },
      rangeCats: byCategoryRange(transactions, categories, series[0]?.date ?? todayISO(), todayISO()),
      cats: byCategory(transactions, categories, m),
      accs: accountBalances(accounts, transactions),
      recent: [...transactions].sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 6),
    };
  }, [transactions, categories, accounts, m, range]);

  const spentBy = Object.fromEntries(s.cats.map((c) => [c.id, c.value]));
  const topBudgets = budgets
    .map((b) => ({ ...b, spent: spentBy[b.categoryId] || 0 }))
    .sort((a, b) => b.spent / b.amount - a.spent / a.amount)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        {/* Solde total mis en avant */}
        <div className="glass glass-hover animate-fade-up relative col-span-2 min-w-0 overflow-hidden p-6 sm:p-8 xl:col-span-1">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl dark:opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(218,119,86,0.22), transparent 70%)' }}
          />
          <div className="relative flex items-center justify-between gap-2">
            <span className="label">Solde total</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Wallet size={16} strokeWidth={1.8} />
            </span>
          </div>
          <div className="serif relative mt-5 whitespace-nowrap text-[36px] leading-[0.95] sm:text-[52px] xl:text-[42px] 2xl:text-[54px]">{money(s.balance)}</div>
          <p className="relative mt-3 text-[13px] text-ink-500 dark:text-ink-400">{`${accounts.length} comptes`}</p>
          <div className="relative mt-5 flex flex-wrap gap-2">
            {s.accs.map((a) => (
              <div key={a.id} className="badge !py-1 !text-xs">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.color }} />
                <span>{a.name}</span>
                <span className="num font-semibold text-ink-900 dark:text-ink-50">{money(a.balance)}</span>
              </div>
            ))}
          </div>
        </div>
        <KpiCard label="Cash flow" value={s.cur.net} icon={Scale} tint="#D97706" trend={change(s.cur.net, s.prev.net)} delay={60} />
        <KpiCard label="Revenus du mois" value={s.cur.income} icon={ArrowDownLeft} tint="#6F7F55" trend={change(s.cur.income, s.prev.income)} delay={120} />
        <KpiCard
          label="Dépenses du mois"
          value={s.cur.expense}
          icon={ArrowUpRight}
          tint="#C2603F"
          trend={change(s.cur.expense, s.prev.expense)}
          goodWhenUp={false}
          delay={180}
          className="col-span-2 xl:col-span-1"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card
          title="Évolution du solde"
          subtitle={
            <span>
              <span className={s.delta >= 0 ? 'text-income' : 'text-expense'}>{signedMoney(s.delta)}</span> sur {range} jours
            </span>
          }
          action={
            <Segmented
              size="sm"
              value={range}
              onChange={setRange}
              options={[
                { value: 7, label: '7J' },
                { value: 30, label: '30J' },
                { value: 90, label: '90J' },
              ]}
            />
          }
        >
          <div className="-mt-1 mb-4">
            <SeriesToggle visible={visible} onToggle={toggleSeries} totals={s.totals} />
          </div>
          <BalanceChart data={s.series} visible={visible} height={300} />
        </Card>

        <Card title="Top catégories" subtitle={`Dépenses · ${range} derniers jours`}>
          <CategoryDonut data={s.rangeCats} showLegend={false} height={200} limit={5} />
          <ul className="mt-5 flex flex-col gap-1">
            {s.rangeCats.slice(0, 5).map((c) => (
              <li key={c.id} className="rounded-lg px-2 py-1.5 text-sm transition-colors duration-300 hover:bg-sand/40 dark:hover:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink-600 dark:text-ink-300">{c.name}</span>
                  <span className="serif text-[15px]">{money(c.value)}</span>
                  <span className="num w-11 shrink-0 text-right text-xs font-medium text-ink-500 dark:text-ink-400">
                    {(c.share * 100).toFixed(c.share < 0.1 ? 1 : 0)} %
                  </span>
                </div>
                <div className="ml-5 mt-1.5 h-1 overflow-hidden rounded-full bg-sand/60 dark:bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${c.share * 100}%`, background: c.color, opacity: 0.85 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card
          title="Opérations récentes"
          action={<button onClick={() => navigate('transactions')} className="btn-ghost !py-1.5 text-xs">Tout voir</button>}
        >
          <TransactionList transactions={s.recent} onSelect={onEdit} />
        </Card>
        <Card
          title="Budgets"
          subtitle="Ce mois-ci"
          action={<button onClick={() => navigate('budgets')} className="btn-ghost !py-1.5 text-xs">Gérer</button>}
        >
          <div className="flex flex-col gap-2">
            {topBudgets.length ? (
              topBudgets.map((b) => (
                <BudgetBar key={b.id} compact category={categoryById(b.categoryId)} spent={b.spent} amount={Number(b.amount)} onClick={() => navigate('budgets')} />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-ink-400">Aucun budget défini.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
