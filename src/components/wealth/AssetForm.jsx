import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Sparkles, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Segmented from '../ui/Segmented';
import { useFinance } from '../../context/FinanceContext';
import { uid } from '../../services/sheetService';
import { getConfig } from '../../config';
import { money, todayISO } from '../../utils/format';
import { CARATS, KINDS, fetchGoldSpot, goldPriceFor, valuationOf, valueOf } from '../../utils/wealth';

const KIND_OPTIONS = Object.entries(KINDS).map(([value, k]) => ({ value, label: k.label }));
const NUM_FIELDS = ['quantity', 'cost', 'price', 'loan', 'rent', 'charges'];
const parse = (v) => Number(String(v ?? '').replace(/\s/g, '').replace(',', '.')) || 0;

const blank = (kind) => ({
  kind,
  subtype: KINDS[kind].subtypes[0].id,
  name: '',
  symbol: kind === 'gold' ? '24' : '',
  quantity: '',
  cost: '',
  price: '',
  date: todayISO(),
  loan: '',
  rent: '',
  charges: '',
  location: '',
  note: '',
});

function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-fg-muted">{hint}</span>}
    </label>
  );
}

/** Ajout / édition d'un actif. `initial` = actif existant, sinon `kind` pour un nouvel actif. */
export default function AssetForm({ open, onClose, initial, kind = 'property' }) {
  const { assetsApi, valuationsApi, valuations } = useFinance();
  const [form, setForm] = useState(() => blank(kind));
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [spotBusy, setSpotBusy] = useState(false);
  const wasOpen = useRef(false);
  const currency = getConfig().currency;

  // Réinitialisé à l'ouverture uniquement (une synchro en fond ne doit pas effacer la saisie)
  useEffect(() => {
    if (open && !wasOpen.current) {
      setForm(
        initial
          ? { ...blank(initial.kind), ...initial, ...Object.fromEntries(NUM_FIELDS.map((k) => [k, initial[k] ? String(initial[k]) : ''])) }
          : blank(kind),
      );
      setErr('');
    }
    wasOpen.current = open;
  }, [open, initial, kind]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const k = form.kind;
  const preview = valueOf({ ...form, ...Object.fromEntries(NUM_FIELDS.map((f) => [f, parse(form[f])])) });

  async function useSpot() {
    setSpotBusy(true);
    try {
      const spot = await fetchGoldSpot(currency, true);
      setForm((f) => ({ ...f, price: goldPriceFor(spot.perGram, f.symbol).toFixed(2) }));
      setErr('');
    } catch {
      setErr("Cours de l'or indisponible pour le moment.");
    } finally {
      setSpotBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setErr('Donnez un nom.');
    const nums = Object.fromEntries(NUM_FIELDS.map((f) => [f, parse(form[f])]));
    if (k === 'property' && !(nums.price > 0 || nums.cost > 0)) return setErr("Indiquez la valeur estimée ou le prix d'achat.");
    if (k !== 'property' && !(nums.quantity > 0)) return setErr(k === 'gold' ? 'Indiquez le poids en grammes.' : 'Indiquez le nombre de titres.');
    // Valeur actuelle absente : on reprend le prix d'achat
    if (!nums.price) nums.price = nums.cost;
    const row = {
      kind: k,
      subtype: form.subtype,
      name: form.name.trim(),
      symbol: String(form.symbol || '').trim().toUpperCase(),
      ...nums,
      date: form.date,
      location: form.location.trim(),
      note: form.note.trim(),
      updatedAt: new Date().toISOString(),
    };
    if (k !== 'property') Object.assign(row, { loan: 0, rent: 0, charges: 0, location: '' });
    setSaving(true);
    try {
      const id = initial?.id ?? uid();
      if (initial) await assetsApi.update(id, row);
      else await assetsApi.add({ id, ...row });
      // Valeur du jour : nourrit la courbe d'évolution du patrimoine
      await valuationsApi.add(valuationOf({ id, ...row }));
      onClose();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!window.confirm(`Supprimer « ${initial.name} » et son historique ?`)) return;
    setSaving(true);
    try {
      await assetsApi.remove(initial.id);
      for (const v of valuations.filter((x) => x.assetId === initial.id)) await valuationsApi.remove(v.id);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const titles = { property: 'Ajouter un bien', stock: 'Ajouter une position', gold: "Ajouter de l'or" };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Modifier' : titles[k]}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex gap-2">
          {initial && (
            <button type="button" onClick={del} disabled={saving} className="btn-ghost !text-error" aria-label="Supprimer">
              <Trash2 size={16} />
            </button>
          )}
          <button type="submit" disabled={saving} className="btn water-glow flex-1 !py-3">
            <Check size={16} /> {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>

        {err && <p className="text-sm text-error">{err}</p>}

        {!initial && (
          <div className="flex justify-center">
            <Segmented options={KIND_OPTIONS} value={k} onChange={(v) => setForm((f) => ({ ...blank(v), name: f.name }))} />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {KINDS[k].subtypes.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => set('subtype')(s.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                form.subtype === s.id ? 'bg-accent text-on-accent' : 'bg-fg/10 text-fg-muted hover:text-fg'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <Field label="Nom" className="min-[420px]:col-span-2">
            <input
              autoFocus
              value={form.name}
              onChange={set('name')}
              placeholder={k === 'property' ? 'Appartement Agdal' : k === 'stock' ? 'Maroc Telecom' : 'Lingot 100 g'}
              className="input"
            />
          </Field>

          {k === 'property' && (
            <>
              <Field label="Ville / quartier">
                <input value={form.location} onChange={set('location')} placeholder="Rabat" className="input" />
              </Field>
              <Field label="Surface (m²)">
                <input inputMode="decimal" value={form.quantity} onChange={set('quantity')} placeholder="95" className="input" />
              </Field>
              <Field label={`Prix d'achat (${currency})`} hint="Frais de notaire compris">
                <input inputMode="decimal" value={form.cost} onChange={set('cost')} placeholder="1 200 000" className="input" />
              </Field>
              <Field label={`Valeur estimée (${currency})`} hint="Prix du marché aujourd'hui">
                <input inputMode="decimal" value={form.price} onChange={set('price')} placeholder="1 350 000" className="input" />
              </Field>
              <Field label={`Crédit restant dû (${currency})`}>
                <input inputMode="decimal" value={form.loan} onChange={set('loan')} placeholder="0" className="input" />
              </Field>
              <Field label="Date d'achat">
                <input type="date" value={form.date} onChange={set('date')} className="input" />
              </Field>
              <Field label={`Loyer mensuel (${currency})`} hint="Vide si résidence principale">
                <input inputMode="decimal" value={form.rent} onChange={set('rent')} placeholder="0" className="input" />
              </Field>
              <Field label={`Charges mensuelles (${currency})`} hint="Mensualité, syndic, taxes">
                <input inputMode="decimal" value={form.charges} onChange={set('charges')} placeholder="0" className="input" />
              </Field>
            </>
          )}

          {k === 'stock' && (
            <>
              <Field label="Ticker">
                <input value={form.symbol} onChange={set('symbol')} placeholder="IAM" className="input uppercase" />
              </Field>
              <Field label="Nombre de titres">
                <input inputMode="decimal" value={form.quantity} onChange={set('quantity')} placeholder="50" className="input" />
              </Field>
              <Field label={`Prix de revient unitaire (${currency})`} hint="PRU, frais compris">
                <input inputMode="decimal" value={form.cost} onChange={set('cost')} placeholder="98,5" className="input" />
              </Field>
              <Field label={`Cours actuel (${currency})`}>
                <input inputMode="decimal" value={form.price} onChange={set('price')} placeholder="104,2" className="input" />
              </Field>
              <Field label="Date d'achat" className="min-[420px]:col-span-2">
                <input type="date" value={form.date} onChange={set('date')} className="input" />
              </Field>
            </>
          )}

          {k === 'gold' && (
            <>
              <div className="flex flex-col gap-1.5 min-[420px]:col-span-2">
                <span className="label">Titre</span>
                <div className="flex gap-1.5">
                  {CARATS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => set('symbol')(String(c))}
                      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                        String(form.symbol) === String(c) ? 'bg-accent text-on-accent' : 'bg-fg/10 text-fg-muted hover:text-fg'
                      }`}
                    >
                      {c} k
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Poids (g)">
                <input inputMode="decimal" value={form.quantity} onChange={set('quantity')} placeholder="100" className="input" />
              </Field>
              <Field label="Date d'achat">
                <input type="date" value={form.date} onChange={set('date')} className="input" />
              </Field>
              <Field label={`Prix d'achat au gramme (${currency})`}>
                <input inputMode="decimal" value={form.cost} onChange={set('cost')} placeholder="950" className="input" />
              </Field>
              <Field label={`Valeur au gramme (${currency})`}>
                <div className="flex gap-2">
                  <input inputMode="decimal" value={form.price} onChange={set('price')} placeholder="1 080" className="input min-w-0 flex-1" />
                  <button type="button" onClick={useSpot} disabled={spotBusy} className="btn-ghost shrink-0 !px-3 text-xs" title="Remplir avec le cours du jour">
                    {spotBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Cours
                  </button>
                </div>
              </Field>
            </>
          )}
        </div>

        <Field label="Note">
          <input value={form.note} onChange={set('note')} placeholder="Facultatif" className="input" />
        </Field>

        {preview > 0 && (
          <p className="text-center text-[13px] text-fg-muted">
            Valeur actuelle : <span className="font-semibold text-fg">{money(preview)}</span>
          </p>
        )}
      </form>
    </Modal>
  );
}
