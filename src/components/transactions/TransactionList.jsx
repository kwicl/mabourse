import { ArrowLeftRight } from 'lucide-react';
import CategoryIcon from '../ui/CategoryIcon';
import { useFinance } from '../../context/FinanceContext';
import { relativeDayLabel } from '../../utils/format';
import Amount from '../ui/Amount';

function Row({ t, onSelect }) {
  const { categoryById, accountById } = useFinance();
  const cat = categoryById(t.categoryId, t.type);
  const isTransfer = t.type === 'transfer';
  const title = isTransfer ? 'Transfert' : cat?.name ?? 'Sans catégorie';
  // La note reprend la catégorie quand elle n'est pas renseignée : inutile de la répéter
  const note = t.note && t.note !== title ? t.note : '';
  const sub = isTransfer
    ? `${accountById(t.accountId)?.name ?? '?'} → ${accountById(t.toAccountId)?.name ?? '?'}`
    : [note, accountById(t.accountId)?.name].filter(Boolean).join(' · ');
  const color = t.type === 'income' ? 'text-success' : t.type === 'expense' ? 'text-fg' : 'text-fg-muted';
  const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '';

  return (
    <button
      onClick={() => onSelect?.(t)}
      className="group flex w-full items-start gap-3.5 rounded-xl px-2.5 py-2.5 text-left transition-all duration-300 ease-out hover:bg-fg/10"
    >
      {isTransfer ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg/10 text-fg-muted ring-1 ring-inset ring-fg/10">
          <ArrowLeftRight size={17} strokeWidth={1.8} />
        </span>
      ) : (
        <CategoryIcon icon={cat?.icon} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[14px] font-medium leading-snug">{title}</span>
        {sub && <span className="block break-words text-[12.5px] leading-snug text-fg-muted">{sub}</span>}
      </span>
      <span className={`num shrink-0 whitespace-nowrap pt-0.5 text-[14px] font-medium transition-transform duration-300 ease-out group-hover:-translate-x-0.5 ${color}`}>
        {sign}
        <Amount value={t.amount} />
      </span>
    </button>
  );
}

/** Liste de transactions groupée par jour. */
export default function TransactionList({ transactions, onSelect, grouped = true, empty = 'Aucune opération.' }) {
  if (!transactions.length) return <p className="py-12 text-center text-sm text-fg-muted">{empty}</p>;
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
              <span className="chip capitalize">{relativeDayLabel(g.date)}</span>
              <span className="h-px flex-1 bg-line" />
              <span className={`num text-xs ${net >= 0 ? 'text-success' : 'text-fg-muted'}`}>
                {net >= 0 ? '+' : '−'}
                <Amount value={Math.abs(net)} />
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
