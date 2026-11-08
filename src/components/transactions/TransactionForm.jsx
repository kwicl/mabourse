import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Segmented from '../ui/Segmented';
import CategoryIcon from '../ui/CategoryIcon';
import { useFinance } from '../../context/FinanceContext';
import { todayISO } from '../../utils/format';
import { getConfig } from '../../config';
import { buildCategory } from '../../utils/categoryStyle';

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
  const { categories, accounts, tx, categoriesApi } = useFinance();
  const [form, setForm] = useState(() => blank(accounts));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [newCat, setNewCat] = useState(null); // null = fermé, sinon nom en cours de saisie

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...blank(accounts), ...initial, amount: String(initial.amount) } : blank(accounts));
      setErr('');
      setNewCat(null);
    }
  }, [open, initial, accounts]);

  const cats = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);

  // Nouvelle catégorie saisie à la main : enregistrée dans la feuille Categories, puis sélectionnée
  async function addCategory() {
    const name = (newCat ?? '').trim();
    if (!name) return;
    const cat = buildCategory(name, form.type, categories);
    if (!cat.id) return setErr('Nom de catégorie invalide.');
    const existing = cats.find((c) => c.id === cat.id || c.name.toLowerCase() === cat.name.toLowerCase());
    try {
      if (!existing) await categoriesApi.add(cat);
      setForm((f) => ({ ...f, categoryId: existing ? existing.id : cat.id }));
      setNewCat(null);
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }
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
        {/* Validation en haut de la fenêtre de saisie */}
        <div className="flex gap-2">
          {initial && (
            <button type="button" onClick={del} disabled={saving} className="btn-ghost !text-expense" aria-label="Supprimer">
              <Trash2 size={16} />
            </button>
          )}
          <button type="submit" disabled={saving} className="btn water-glow flex-1 !py-3">
            <Check size={16} /> {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>

        {err && <p className="text-sm text-expense">{err}</p>}

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
            <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4">
              {cats.map((c) => {
                const active = form.categoryId === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                    className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-0.5 py-2 text-[11px] font-medium leading-tight tracking-[-0.035em] transition ${
                      active ? 'bg-white shadow-soft ring-1 ring-accent/50 dark:bg-white/[0.06]' : 'hover:bg-sand/40 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <CategoryIcon icon={c.icon} color={c.color} size={38} />
                    <span className="w-full hyphens-auto break-words text-center">{c.name}</span>
                  </button>
                );
              })}
              {newCat === null && (
                <button
                  type="button"
                  onClick={() => setNewCat('')}
                  className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-0.5 py-2 text-[11px] font-medium leading-tight tracking-[-0.035em] text-ink-500 transition hover:bg-sand/40 dark:text-ink-400 dark:hover:bg-white/[0.03]"
                >
                  <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-dashed border-ink-300 dark:border-ink-600">
                    <Plus size={16} />
                  </span>
                  <span className="w-full text-center">Nouvelle</span>
                </button>
              )}
            </div>
            {newCat !== null && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  autoFocus
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCategory();
                    } else if (e.key === 'Escape') {
                      e.stopPropagation();
                      setNewCat(null);
                    }
                  }}
                  placeholder={form.type === 'income' ? 'Nouvelle catégorie de revenu' : 'Nouvelle catégorie de dépense'}
                  aria-label="Nom de la nouvelle catégorie"
                  maxLength={40}
                  className="input min-w-0 flex-1"
                />
                <button type="button" onClick={addCategory} disabled={!newCat.trim()} className="btn-primary h-11 shrink-0">
                  <Check size={16} /> Créer
                </button>
                <button type="button" onClick={() => setNewCat(null)} className="btn-ghost h-11 w-11 shrink-0 !p-0" aria-label="Annuler">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="label">Date</span>
            <input type="date" value={form.date} onChange={set('date')} className="input" required />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="label">{form.type === 'transfer' ? 'Depuis' : 'Compte'}</span>
            <select value={form.accountId} onChange={set('accountId')} className="input">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          {form.type === 'transfer' && (
            <label className="flex min-w-0 flex-col gap-1.5 min-[420px]:col-span-2">
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

      </form>
    </Modal>
  );
}
