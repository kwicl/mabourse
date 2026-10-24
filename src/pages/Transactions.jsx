import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Segmented from '../components/ui/Segmented';
import TransactionList from '../components/transactions/TransactionList';
import { useFinance } from '../context/FinanceContext';
import { money } from '../utils/format';

export default function Transactions({ onEdit }) {
  const { transactions, categories, accounts } = useFinance();
  const [type, setType] = useState('all');
  const [cat, setCat] = useState('');
  const [acc, setAcc] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return transactions
      .filter((t) => type === 'all' || t.type === type)
      .filter((t) => !cat || t.categoryId === cat)
      .filter((t) => !acc || t.accountId === acc || t.toAccountId === acc)
      .filter((t) => !from || t.date >= from)
      .filter((t) => !to || t.date <= to)
      .filter((t) => !needle || String(t.note).toLowerCase().includes(needle))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [transactions, type, cat, acc, from, to, q]);

  const totals = filtered.reduce(
    (s, t) => {
      if (t.type === 'income') s.income += Number(t.amount);
      if (t.type === 'expense') s.expense += Number(t.amount);
      return s;
    },
    { income: 0, expense: 0 },
  );

  const hasFilters = type !== 'all' || cat || acc || from || to || q;
  const reset = () => {
    setType('all');
    setCat('');
    setAcc('');
    setFrom('');
    setTo('');
    setQ('');
  };

  const [limit, setLimit] = useState(60);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              value={type}
              onChange={setType}
              size="sm"
              options={[
                { value: 'all', label: 'Tout' },
                { value: 'expense', label: 'Dépenses' },
                { value: 'income', label: 'Revenus' },
                { value: 'transfer', label: 'Transferts' },
              ]}
            />
            <div className="relative w-full sm:w-64">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une note" className="input !py-2.5 !pl-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="input !py-2.5">
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={acc} onChange={(e) => setAcc(e.target.value)} className="input !py-2.5">
              <option value="">Tous comptes</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input !py-2.5" aria-label="Du" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input !py-2.5" aria-label="Au" />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="text-ink-400">{filtered.length} opérations</span>
            <span className="num text-income">+{money(totals.income)}</span>
            <span className="num text-expense">−{money(totals.expense)}</span>
            {hasFilters && (
              <button onClick={reset} className="btn-ghost ml-auto !py-1 text-xs">
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <TransactionList transactions={filtered.slice(0, limit)} onSelect={onEdit} empty="Aucune opération ne correspond aux filtres." />
        {filtered.length > limit && (
          <div className="mt-4 flex justify-center">
            <button onClick={() => setLimit((l) => l + 60)} className="btn-ghost text-sm">Afficher plus</button>
          </div>
        )}
      </Card>
    </div>
  );
}
