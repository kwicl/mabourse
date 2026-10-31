import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Scale, Wallet } from 'lucide-react';
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
import { accountBalances, byCategory, byCategoryRange, seriesBetween, totalBalance, totalsBetween } from '../utils/stats';
import { monthKey, pct, signedMoney, todayISO } from '../utils/format';
import { PERIODS, periodRange, rangeLabel } from '../utils/periods';
import Amount from '../components/ui/Amount';

const change = (cur, prev) => (prev ? (cur - prev) / Math.abs(prev) : NaN);

const PERIOD_KEY = 'mabourse-period';
const CUSTOM_KEY = 'mabourse-period-custom';
const HIDE_KEY = 'mabourse-hide-private';
const PRIVATE_SERIES = ['balance', 'income'];
const readPeriod = () => {
  try {
    const k = localStorage.getItem(PERIOD_KEY);
    return PERIODS.some((p) => p.key === k) ? k : 'month';
  } catch {
    return 'month';
  }
};
const readCustom = () => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || null;
  } catch {
    return null;
  }
};
const store = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* stockage indisponible */
  }
};
const PRESETS = PERIODS.filter((p) => p.key !== 'custom').map((p) => ({ value: p.key, label: p.label }));

const SERIES = [
  { key: 'balance', label: 'Solde' },
  { key: 'income', label: 'Revenus' },
  { key: 'expense', label: 'Dépenses' },
];

/** Boutons d'affichage des séries (au moins une reste active). */
function SeriesToggle({ visible, onToggle, totals, masked = [] }) {
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
            <span className={`serif text-[14px] ${on ? '' : 'opacity-60'}`}><Amount value={totals[key]} hidden={masked.includes(key)} /></span>
          </button>
        );
      })}
    </div>
  );
}

export default function Dashboard({ onEdit }) {
  const { transactions, categories, accounts, budgets, categoryById } = useFinance();
  const [periodKey, setPeriodKey] = useState(readPeriod);
  const [custom, setCustom] = useState(readCustom);
  const choosePeriod = (k) => {
    setPeriodKey(k);
    store(PERIOD_KEY, k);
  };
  // Saisie Du / Au : bascule en période personnalisée
  const chooseDate = (field, value) => {
    if (!value) return;
    const next = { from: r.from, to: r.to, [field]: value };
    setCustom(next);
    store(CUSTOM_KEY, JSON.stringify(next));
    choosePeriod('custom');
  };
  // Solde, revenus et cash flow masqués par défaut (confidentialité) ; le choix est mémorisé sur l'appareil
  const [hidePrivate, setHidePrivate] = useState(() => {
    try {
      return localStorage.getItem(HIDE_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const togglePrivate = () =>
    setHidePrivate((h) => {
      store(HIDE_KEY, h ? '0' : '1');
      return !h;
    });
  const eyeButton = (
    <button
      type="button"
      onClick={togglePrivate}
      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-all duration-300 ease-out hover:bg-sand/50 hover:text-ink-900 dark:hover:bg-white/[0.05] dark:hover:text-ink-50"
      aria-label={hidePrivate ? 'Afficher les montants' : 'Masquer les montants'}
      title={hidePrivate ? 'Afficher les montants' : 'Masquer les montants'}
    >
      {hidePrivate ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
    </button>
  );
  const [visible, setVisible] = useState({ balance: true, income: false, expense: false });
  const toggleSeries = (key) =>
    setVisible((v) => {
      const next = { ...v, [key]: !v[key] };
      return Object.values(next).some(Boolean) ? next : v;
    });

  const m = monthKey(todayISO());
  const r = useMemo(() => periodRange(periodKey, transactions, custom), [periodKey, transactions, custom]);
  const base = PERIODS.find((p) => p.key === periodKey);
  const period = periodKey === 'custom' ? { ...base, label: rangeLabel(r.from, r.to) } : base;
  const s = useMemo(() => {
    const cur = totalsBetween(transactions, r.from, r.to);
    const prev = r.prevFrom ? totalsBetween(transactions, r.prevFrom, r.prevTo) : null;
    const series = seriesBetween(accounts, transactions, r.from, r.to);
    const balance = totalBalance(accounts, transactions);
    const endBalance = series[series.length - 1]?.balance ?? balance;
    return {
      cur,
      prev,
      series,
      balance,
      delta: cur.net,
      totals: { balance: endBalance, income: cur.income, expense: cur.expense },
      rangeCats: byCategoryRange(transactions, categories, r.from, r.to),
      cats: byCategory(transactions, categories, m),
      accs: accountBalances(accounts, transactions),
      recent: [...transactions].sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 6),
    };
  }, [transactions, categories, accounts, m, r]);
  const trend = (k) => (s.prev ? change(s.cur[k], s.prev[k]) : NaN);

  const spentBy = Object.fromEntries(s.cats.map((c) => [c.id, c.value]));
  const topBudgets = budgets
    .map((b) => ({ ...b, spent: spentBy[b.categoryId] || 0 }))
    .sort((a, b) => b.spent / b.amount - a.spent / a.amount)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-5">
      {/* Sélecteur de période global : préréglages + plage Du / Au */}
      <div className="-mb-1 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <Segmented value={periodKey} onChange={choosePeriod} options={PRESETS} />
        </div>
        <div
          className={`grid grid-cols-1 gap-1 rounded-2xl border p-2 transition-all duration-300 ease-out min-[420px]:grid-cols-2 sm:flex sm:items-center sm:gap-2 sm:rounded-full sm:p-1 sm:pl-4 ${
            periodKey === 'custom'
              ? 'border-accent/40 bg-white shadow-soft dark:bg-white/[0.06]'
              : 'border-sand-line bg-ink-100/70 dark:border-night-line dark:bg-white/[0.03]'
          }`}
        >
          <label className="flex min-w-0 items-center gap-2 pl-2 sm:pl-0">
            <span className="label shrink-0">Du</span>
            <input
              type="date"
              value={r.from}
              max={r.to}
              onChange={(e) => chooseDate('from', e.target.value)}
              className="w-full min-w-0 rounded-full bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-white/70 sm:w-auto dark:focus:bg-white/[0.05]"
              aria-label="Date de début"
            />
          </label>
          <label className="flex min-w-0 items-center gap-2 pl-2 sm:pl-0">
            <span className="label shrink-0">Au</span>
            <input
              type="date"
              value={r.to}
              min={r.from}
              onChange={(e) => chooseDate('to', e.target.value)}
              className="w-full min-w-0 rounded-full bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-white/70 sm:w-auto dark:focus:bg-white/[0.05]"
              aria-label="Date de fin"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        {/* Dépenses de la période mises en avant */}
        <div className="glass glass-hover animate-fade-up relative col-span-2 min-w-0 overflow-hidden p-6 sm:p-8 xl:col-span-1">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl dark:opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(218,119,86,0.22), transparent 70%)' }}
          />
          <div className="relative flex items-center justify-between gap-2">
            <span className="label">Dépenses · {period.label}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-expense/10 text-expense">
              <ArrowUpRight size={16} strokeWidth={1.8} />
            </span>
          </div>
          <div className="serif relative mt-5 whitespace-nowrap text-[36px] leading-[0.95] sm:text-[52px] xl:text-[42px] 2xl:text-[54px]">
            <Amount value={s.cur.expense} />
          </div>
          <div className="relative mt-3 flex flex-wrap items-center gap-1.5 text-[13px]">
            {Number.isFinite(trend('expense')) ? (
              <>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    trend('expense') <= 0 ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
                  }`}
                >
                  {pct(trend('expense'))}
                </span>
                <span className="text-ink-500 dark:text-ink-400">{period.vs}</span>
              </>
            ) : (
              <span className="text-ink-500 dark:text-ink-400">{period.label}</span>
            )}
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2">
            {s.rangeCats.slice(0, 3).map((c) => (
              <div key={c.id} className="badge !py-1 !text-xs">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                <span>{c.name}</span>
                <span className="num font-semibold text-ink-900 dark:text-ink-50">
                  <Amount value={c.value} />
                </span>
              </div>
            ))}
          </div>
        </div>
        <KpiCard
          label="Solde total"
          value={s.balance}
          icon={Wallet}
          tint="#CC5A37"
          hint={s.accs.map((a) => a.name).join(' · ')}
          hidden={hidePrivate}
          action={eyeButton}
        />
        {/* Le cash flow (revenus − dépenses) révèle les revenus : masqué avec eux */}
        <KpiCard
          label="Cash flow"
          value={s.cur.net}
          icon={Scale}
          tint="#D97706"
          trend={hidePrivate ? NaN : trend('net')}
          trendLabel={period.vs}
          hint={period.label}
          hidden={hidePrivate}
          action={eyeButton}
          delay={60}
        />
        <KpiCard
          label="Revenus"
          value={s.cur.income}
          icon={ArrowDownLeft}
          tint="#6F7F55"
          trend={hidePrivate ? NaN : trend('income')}
          trendLabel={period.vs}
          hint={period.label}
          hidden={hidePrivate}
          action={eyeButton}
          delay={120}
          className="col-span-2 xl:col-span-1"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card
          title="Évolution du solde"
          subtitle={
            <span>
              {/* Variation du solde = cash flow : masquée avec les montants privés */}
              {hidePrivate ? (
                <span>••••••</span>
              ) : (
                <span className={s.delta >= 0 ? 'text-income' : 'text-expense'}>{signedMoney(s.delta)}</span>
              )}{' '}
              · {period.label}
            </span>
          }
        >
          <div className="-mt-1 mb-4">
            <SeriesToggle visible={visible} onToggle={toggleSeries} totals={s.totals} masked={hidePrivate ? PRIVATE_SERIES : []} />
          </div>
          <BalanceChart data={s.series} visible={visible} masked={hidePrivate ? PRIVATE_SERIES : []} height={300} />
        </Card>

        <Card title="Top catégories" subtitle={`Dépenses · ${period.label}`}>
          <CategoryDonut data={s.rangeCats} showLegend={false} height={200} limit={5} />
          <ul className="mt-5 flex flex-col gap-1">
            {s.rangeCats.slice(0, 5).map((c) => (
              <li key={c.id} className="rounded-lg px-2 py-1.5 text-sm transition-colors duration-300 hover:bg-sand/40 dark:hover:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink-600 dark:text-ink-300">{c.name}</span>
                  <span className="serif text-[15px]"><Amount value={c.value} /></span>
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
                <BudgetBar key={b.id} compact category={categoryById(b.categoryId, 'expense')} spent={b.spent} amount={Number(b.amount)} onClick={() => navigate('budgets')} />
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
