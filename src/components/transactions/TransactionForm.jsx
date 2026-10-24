import { useEffect, useMemo, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Segmented from '../ui/Segmented';
import CategoryIcon from '../ui/CategoryIcon';
import { useFinance } from '../../context/FinanceContext';
import { todayISO } from '../../utils/format';
import { getConfig } from '../../config';

const TYPES = [
  { value: 'expense', label: 'Dépense' },
  { value: 'income', label: 'Revenu' },
  { value: 'transfer', label: 'Transfert' },
];

const blank = (accounts) => ({
  type: 'expense',
  amount: '',
  date: todayISO(),
  categoryId: '',
  accountId: accounts[0]?.id ?? '',
  toAccountId: accounts[1]?.id ?? '',
  note: '',
});

/** Formulaire d'ajout / édition rapide (modal). `initial` = transaction existante ou null. */
export default function TransactionForm({ open, onClose, initial }) {
  const { categories, accounts, tx } = useFinance();
  const [form, setForm] = useState(() => blank(accounts));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...blank(accounts), ...initial, amount: String(initial.amount) } : blank(accounts));
      setErr('');
    }
  }, [open, initial, accounts]);

  const cats = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  async function submit(e) {
    e.preventDefault();
    const amount = Number(String(form.amount).replace(',', '.'));
    if (!(amount > 0)) return setErr('Montant invalide.');
    if (form.type !== 'transfer' && !form.categoryId) return setErr('Choisissez une catégorie.');
    if (form.type === 'transfer' && form.accountId === form.toAccountId) return setErr('Comptes source et destination identiques.');

    const row = {
      type: form.type,
      amount,
      date: form.date,
      categoryId: form.type === 'transfer' ? '' : form.categoryId,
      accountId: form.accountId,
      toAccountId: form.type === 'transfer' ? form.toAccountId : '',
      // Note vide : reprend le nom de la catégorie
      note: form.note.trim() || (form.type === 'transfer' ? '' : cats.find((c) => c.id === form.categoryId)?.name ?? ''),
    };
    setSaving(true);
    try {
      if (initial) await tx.update(initial.id, row);
      else await tx.add(row);
      onClose();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!window.confirm('Supprimer définitivement cette opération ?')) return;
    setSaving(true);
    try {
      await tx.remove(initial.id);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const accent = form.type === 'income' ? 'text-income' : form.type === 'expense' ? 'text-expense' : 'text-ink-500';

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier l'opération" : 'Nouvelle opération'}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex justify-center">
          <Segmented options={TYPES} value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v, categoryId: '' }))} />
        </div>

        <div className="flex items-baseline justify-center gap-2 py-2">
          <input
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={form.amount}
            onChange={set('amount')}
            className={`serif w-full bg-transparent text-center text-6xl outline-none placeholder:text-ink-300 dark:placeholder:text-ink-600 ${accent}`}
          />
          <span className="text-lg font-medium text-ink-400">{getConfig().currency}</span>
        </div>

        {form.type !== 'transfer' ? (
          <div>
            <span className="label mb-2 block">Catégorie</span>
            <div className="grid grid-cols-4 gap-2">
              {cats.map((c) => {
                const active = form.categoryId === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-[11px] font-medium transition ${
                      active ? 'bg-white shadow-soft ring-1 ring-accent/50 dark:bg-white/[0.06]' : 'hover:bg-sand/40 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <CategoryIcon icon={c.icon} color={c.color} size={38} />
                    <span className="w-full truncate text-center">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="label">Date</span>
            <input type="date" value={form.date} onChange={set('date')} className="input" required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">{form.type === 'transfer' ? 'Depuis' : 'Compte'}</span>
            <select value={form.accountId} onChange={set('accountId')} className="input">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          {form.type === 'transfer' && (
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className="label">Vers</span>
              <select value={form.toAccountId} onChange={set('toAccountId')} className="input">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="label">Note</span>
          <input value={form.note} onChange={set('note')} placeholder="Facultatif" className="input" />
        </label>

        {err && <p className="text-sm text-expense">{err}</p>}

        <div className="flex gap-2">
          {initial && (
            <button type="button" onClick={del} disabled={saving} className="btn-ghost !text-expense" aria-label="Supprimer">
              <Trash2 size={16} />
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary flex-1 !py-3">
            <Check size={16} /> {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
