import { ArrowLeftRight } from 'lucide-react';
import CategoryIcon from '../ui/CategoryIcon';
import { useFinance } from '../../context/FinanceContext';
import { money, relativeDayLabel } from '../../utils/format';

function Row({ t, onSelect }) {
  const { categoryById, accountById } = useFinance();
  const cat = categoryById(t.categoryId);
  const isTransfer = t.type === 'transfer';
  const title = isTransfer ? 'Transfert' : cat?.name ?? 'Sans catégorie';
  const sub = isTransfer
    ? `${accountById(t.accountId)?.name ?? '?'} → ${accountById(t.toAccountId)?.name ?? '?'}`
    : [t.note, accountById(t.accountId)?.name].filter(Boolean).join(' · ');
  const color = t.type === 'income' ? 'text-income' : t.type === 'expense' ? 'text-ink-900 dark:text-ink-50' : 'text-ink-400';
  const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '';

  return (
    <button
      onClick={() => onSelect?.(t)}
      className="group flex w-full items-center gap-3.5 rounded-xl px-2.5 py-2.5 text-left transition-all duration-300 ease-out hover:bg-sand/40 dark:hover:bg-white/[0.03]"
    >
      {isTransfer ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-200/50 text-ink-500 ring-1 ring-inset ring-black/[0.03] dark:bg-white/[0.05]">
          <ArrowLeftRight size={17} strokeWidth={1.8} />
        </span>
      ) : (
        <CategoryIcon icon={cat?.icon} color={cat?.color} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium">{title}</span>
        {sub && <span className="block truncate text-[12.5px] text-ink-500 dark:text-ink-400">{sub}</span>}
      </span>
      <span className={`num text-[14px] font-medium transition-transform duration-300 ease-out group-hover:-translate-x-0.5 ${color}`}>
        {sign}
        {money(t.amount)}
      </span>
    </button>
  );
}

/** Liste de transactions groupée par jour. */
export default function TransactionList({ transactions, onSelect, grouped = true, empty = 'Aucune opération.' }) {
  if (!transactions.length) return <p className="py-12 text-center text-sm text-ink-500">{empty}</p>;
  if (!grouped) return transactions.map((t) => <Row key={t.id} t={t} onSelect={onSelect} />);

  const groups = [];
  for (const t of transactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const net = g.items.reduce((s, t) => s + (t.type === 'income' ? +t.amount : t.type === 'expense' ? -t.amount : 0), 0);
        return (
          <div key={g.date}>
            <div className="mb-1.5 flex items-center justify-between gap-3 px-1">
              <span className="badge capitalize">{relativeDayLabel(g.date)}</span>
              <span className="h-px flex-1 bg-sand-line dark:bg-night-line" />
              <span className={`num text-xs ${net >= 0 ? 'text-income' : 'text-ink-500 dark:text-ink-400'}`}>
                {net >= 0 ? '+' : '−'}
                {money(Math.abs(net))}
              </span>
            </div>
            {g.items.map((t) => (
              <Row key={t.id} t={t} onSelect={onSelect} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
