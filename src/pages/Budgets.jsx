import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import CategoryIcon from '../components/ui/CategoryIcon';
import BudgetBar, { budgetTone } from '../components/BudgetBar';
import MonthPicker from '../components/MonthPicker';
import { useFinance } from '../context/FinanceContext';
import { byCategory } from '../utils/stats';
import { monthKey, todayISO } from '../utils/format';
import Amount from '../components/ui/Amount';

function BudgetForm({ open, onClose, initial }) {
  const { categories, budgets, budgetsApi } = useFinance();
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');

  // Réinitialise à l'ouverture
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setCategoryId(initial?.categoryId ?? '');
      setAmount(initial ? String(initial.amount) : '');
      setErr('');
    }
  }

  const used = new Set(budgets.filter((b) => b.id !== initial?.id).map((b) => b.categoryId));
  const options = categories.filter((c) => c.type === 'expense' && !used.has(c.id));

  async function submit(e) {
    e.preventDefault();
    const value = Number(String(amount).replace(',', '.'));
    if (!categoryId) return setErr('Choisissez une catégorie.');
    if (!(value > 0)) return setErr('Montant invalide.');
    try {
      if (initial) await budgetsApi.update(initial.id, { categoryId, amount: value });
      else await budgetsApi.add({ categoryId, amount: value });
      onClose();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function del() {
    if (!window.confirm('Supprimer ce budget ?')) return;
    await budgetsApi.remove(initial.id);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier le budget' : 'Nouveau budget'}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div>
          <span className="label mb-2 block">Catégorie</span>
          <div className="grid grid-cols-4 gap-2">
            {options.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-[11px] font-medium transition ${
                  categoryId === c.id ? 'bg-white shadow-soft ring-1 ring-accent/50 dark:bg-white/[0.06]' : 'hover:bg-sand/40 dark:hover:bg-white/[0.03]'
                }`}
              >
                <CategoryIcon icon={c.icon} color={c.color} size={38} />
                <span className="w-full truncate text-center">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="label">Limite mensuelle</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="input num text-lg" />
        </label>
        {err && <p className="text-sm text-expense">{err}</p>}
        <div className="flex gap-2">
          {initial && (
            <button type="button" onClick={del} className="btn-ghost !text-expense" aria-label="Supprimer">
              <Trash2 size={16} />
            </button>
          )}
          <button className="btn-primary flex-1 !py-3">{initial ? 'Enregistrer' : 'Créer le budget'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Budgets() {
  const { transactions, categories, budgets, categoryById } = useFinance();
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [editing, setEditing] = useState(undefined); // undefined = fermé, null = nouveau

  const rows = useMemo(() => {
    const spent = Object.fromEntries(byCategory(transactions, categories, month).map((c) => [c.id, c.value]));
    return budgets
      .map((b) => ({ ...b, amount: Number(b.amount), spent: spent[b.categoryId] || 0 }))
      .sort((a, b) => b.spent / b.amount - a.spent / a.amount);
  }, [transactions, categories, budgets, month]);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const ratio = total ? spent / total : 0;
  const tone = budgetTone(ratio);
  const over = rows.filter((r) => r.spent > r.amount).length;
  const ring = [{ value: Math.min(ratio * 100, 100), fill: ratio >= 1 ? '#C2603F' : ratio >= 0.75 ? '#D97706' : '#6F7F55' }];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker value={month} onChange={setMonth} />
        <button onClick={() => setEditing(null)} className="btn-primary">
          <Plus size={16} /> Nouveau budget
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card title="Vue d'ensemble">
          <div className="relative mx-auto h-52 w-52">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="78%" outerRadius="100%" data={ring} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} background={{ fill: 'rgba(143,138,132,0.14)' }} animationDuration={900} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`serif text-5xl ${tone.text}`}>{Math.round(ratio * 100)}%</span>
              <span className="text-xs text-ink-400">du budget utilisé</span>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="label">Dépensé</dt>
              <dd className="num mt-1 font-semibold"><Amount value={spent} /></dd>
            </div>
            <div>
              <dt className="label">Budget</dt>
              <dd className="num mt-1 font-semibold"><Amount value={total} /></dd>
            </div>
            <div>
              <dt className="label">Reste</dt>
              <dd className={`num mt-1 font-semibold ${total - spent < 0 ? 'text-expense' : ''}`}><Amount value={total - spent} /></dd>
            </div>
            <div>
              <dt className="label">Dépassés</dt>
              <dd className={`mt-1 font-semibold ${over ? 'text-expense' : 'text-income'}`}>{over} / {rows.length}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Par catégorie" subtitle="Cliquez sur un budget pour le modifier">
          <div className="flex flex-col gap-2">
            {rows.length ? (
              rows.map((r) => (
                <BudgetBar key={r.id} category={categoryById(r.categoryId, 'expense')} spent={r.spent} amount={r.amount} onClick={() => setEditing(r)} />
              ))
            ) : (
              <p className="py-12 text-center text-sm text-ink-400">Aucun budget. Créez-en un pour suivre vos dépenses.</p>
            )}
          </div>
        </Card>
      </div>

      <BudgetForm open={editing !== undefined} initial={editing} onClose={() => setEditing(undefined)} />
    </div>
  );
}
