import { useCallback, useEffect, useState } from 'react';
import { CandlestickChart, Coins, Loader2, Plus, RefreshCw, Sparkles } from 'lucide-react';
import Amount from '../ui/Amount';
import Card from '../ui/Card';
import { useFinance } from '../../context/FinanceContext';
import { getConfig } from '../../config';
import { money, pct } from '../../utils/format';
import { CARATS, assetHistory, fetchGoldSpot, gainOf, gainPct, goldPriceFor, investedOf, subtypeLabel, valuationOf, valueOf } from '../../utils/wealth';
import { Sparkline } from './WealthCharts';
import { GainPill, Stat } from './RealEstate';

/** Initiales du ticker dans une pastille. */
function Ticker({ a }) {
  const gold = a.kind === 'gold';
  const txt = gold ? 'Au' : (a.symbol || a.name).replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[10px] font-bold tracking-wide ${
        gold ? 'bg-warning/20 text-[13px] text-warning' : 'bg-fg/10 text-fg'
      }`}
    >
      {txt}
    </span>
  );
}

function HoldingRow({ a, weight, hidden, onEdit, valuations }) {
  const up = gainOf(a) >= 0;
  return (
    <button type="button" onClick={() => onEdit(a)} className="relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition hover:bg-fg/5">
      {/* Poids de la ligne dans le portefeuille, en filigrane */}
      <span className="pointer-events-none absolute inset-y-0 left-0 bg-accent/10" style={{ width: `${weight * 100}%` }} />
      <Ticker a={a} />
      <span className="relative min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{a.name}</span>
        <span className="block truncate text-[12px] text-fg-muted">
          {a.kind === 'gold' ? `${a.quantity} g · ${a.symbol || 24} k` : `${a.quantity} × ${money(a.price)}`} · {subtypeLabel(a)}
        </span>
      </span>
      <Sparkline points={assetHistory(a, valuations)} width={64} height={24} className="relative hidden sm:block" />
      <span className="relative shrink-0 text-right">
        <Amount value={valueOf(a)} hidden={hidden} className="block text-[14px] font-semibold" />
        <span className={`block text-[12px] font-medium ${up ? 'text-success' : 'text-error'}`}>
          {hidden ? '••' : `${up ? '+' : ''}${money(gainOf(a))} · ${pct(gainPct(a))}`}
        </span>
      </span>
    </button>
  );
}

function EmptyLine({ icon: Icon, text, cta, onClick }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center text-fg-muted">
      <Icon size={26} strokeWidth={1.5} />
      <p className="max-w-xs text-[13px]">{text}</p>
      <button type="button" onClick={onClick} className="btn-ghost text-xs">
        <Plus size={14} /> {cta}
      </button>
    </div>
  );
}

/** Cours de l'or du jour + application aux avoirs en or. */
function GoldPanel({ golds, hidden, onAdd, onEdit, valuations, total }) {
  const { assetsApi, valuationsApi } = useFinance();
  const currency = getConfig().currency;
  const [spot, setSpot] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | error | applying | done

  const load = useCallback(
    async (force = false) => {
      setState('loading');
      try {
        setSpot(await fetchGoldSpot(currency, force));
        setState('idle');
      } catch {
        setState('error');
      }
    },
    [currency],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function apply() {
    if (!spot) return;
    setState('applying');
    for (const a of golds) {
      const price = Math.round(goldPriceFor(spot.perGram, a.symbol) * 100) / 100;
      const next = { ...a, price, updatedAt: new Date().toISOString() };
      await assetsApi.update(a.id, { price, updatedAt: next.updatedAt });
      await valuationsApi.add(valuationOf(next));
    }
    setState('done');
    setTimeout(() => setState('idle'), 2500);
  }

  const grams = golds.reduce((s, a) => s + (Number(a.quantity) || 0), 0);
  return (
    <Card
      title="Or"
      subtitle={grams ? `${grams.toLocaleString('fr-FR')} g détenus · valeur refuge` : 'Lingots, pièces et bijoux'}
      action={
        <button type="button" onClick={() => onAdd('gold')} className="btn-ghost shrink-0 !px-3 text-xs">
          <Plus size={14} /> Ajouter
        </button>
      }
    >
      {/* Cours du jour */}
      <div className="rounded-2xl bg-warning/10 p-4 ring-1 ring-warning/30">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label !text-warning">Cours du jour · 24 k</p>
            <p className="serif mt-1 text-[26px] leading-none">
              {spot ? (
                <>
                  {money(spot.perGram)}
                  <span className="ml-1 font-sans text-[12px] text-fg-muted">/ g</span>
                </>
              ) : state === 'error' ? (
                <span className="text-[14px] text-fg-muted">Indisponible</span>
              ) : (
                <Loader2 size={18} className="animate-spin" />
              )}
            </p>
          </div>
          <button type="button" onClick={() => load(true)} className="btn-ghost h-9 w-9 shrink-0 !p-0" aria-label="Actualiser le cours" title="Actualiser">
            <RefreshCw size={15} className={state === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>
        {spot && (
          <>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {CARATS.map((c) => (
                <div key={c} className="rounded-xl bg-fg/5 px-2 py-2 text-center">
                  <p className="text-[11px] font-semibold text-fg-muted">{c} k</p>
                  <p className="mt-0.5 text-[12px] font-semibold">{Math.round(goldPriceFor(spot.perGram, c)).toLocaleString('fr-FR')}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-fg-muted">
              Once : {spot.usdOz.toLocaleString('fr-FR')} $ · 1 $ = {spot.rate.toFixed(2)} {currency}
              {spot.stale ? ' · dernier cours connu' : ''} · prix spot, hors façon et marge
            </p>
          </>
        )}
      </div>

      {golds.length > 0 && spot && (
        <button type="button" onClick={apply} disabled={state === 'applying'} className="btn water-glow mt-4 w-full !py-2.5">
          {state === 'applying' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {state === 'done' ? 'Valeurs mises à jour' : 'Revaloriser mon or au cours du jour'}
        </button>
      )}

      <div className="mt-4 flex flex-col">
        {golds.length ? (
          golds.map((a) => <HoldingRow key={a.id} a={a} weight={total ? valueOf(a) / total : 0} hidden={hidden} onEdit={onEdit} valuations={valuations} />)
        ) : (
          <EmptyLine icon={Coins} text="Ajoutez vos lingots, pièces ou bijoux : leur valeur suit le cours du jour en un geste." cta="Ajouter de l'or" onClick={() => onAdd('gold')} />
        )}
      </div>
    </Card>
  );
}

export default function Markets({ hidden, onAdd, onEdit }) {
  const { assets, valuations } = useFinance();
  const stocks = assets.filter((a) => a.kind === 'stock').sort((a, b) => valueOf(b) - valueOf(a));
  const golds = assets.filter((a) => a.kind === 'gold').sort((a, b) => valueOf(b) - valueOf(a));
  const all = [...stocks, ...golds];
  const value = all.reduce((s, a) => s + valueOf(a), 0);
  const invested = all.reduce((s, a) => s + investedOf(a), 0);
  const stockValue = stocks.reduce((s, a) => s + valueOf(a), 0);
  const goldValue = golds.reduce((s, a) => s + valueOf(a), 0);
  const gain = value - invested;

  return (
    <div className="flex flex-col gap-5">
      <div className="glass animate-fade-up grid grid-cols-2 gap-5 p-6 sm:p-7 lg:grid-cols-4">
        <Stat label="Valeur du portefeuille">
          <Amount value={value} hidden={hidden} />
        </Stat>
        <Stat label="Montant investi">
          <Amount value={invested} hidden={hidden} />
        </Stat>
        <Stat label="Plus-value latente" tone={gain >= 0 ? 'text-success' : 'text-error'}>
          <Amount value={Math.abs(gain)} sign={gain >= 0 ? '+' : '−'} hidden={hidden} />
        </Stat>
        <div className="min-w-0">
          <p className="label">Performance</p>
          <div className="mt-2">
            <GainPill value={gain} ratio={invested ? gain / invested : 0} hidden={hidden} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card
          className="xl:col-span-3"
          title="Actions & fonds"
          subtitle={stocks.length ? `${stocks.length} ligne${stocks.length > 1 ? 's' : ''} · ${hidden ? '••' : money(stockValue)}` : 'Bourse de Casablanca ou marchés étrangers'}
          action={
            <button type="button" onClick={() => onAdd('stock')} className="btn-ghost shrink-0 !px-3 text-xs">
              <Plus size={14} /> Ajouter
            </button>
          }
        >
          {stocks.length ? (
            <div className="-mx-3 flex flex-col">
              {stocks.map((a) => (
                <HoldingRow key={a.id} a={a} weight={stockValue ? valueOf(a) / stockValue : 0} hidden={hidden} onEdit={onEdit} valuations={valuations} />
              ))}
            </div>
          ) : (
            <EmptyLine
              icon={CandlestickChart}
              text="Ajoutez vos actions, ETF ou OPCVM avec leur prix de revient : la plus-value se calcule toute seule à chaque mise à jour du cours."
              cta="Ajouter une position"
              onClick={() => onAdd('stock')}
            />
          )}
        </Card>
        <div className="xl:col-span-2">
          <GoldPanel golds={golds} hidden={hidden} onAdd={onAdd} onEdit={onEdit} valuations={valuations} total={goldValue} />
        </div>
      </div>
    </div>
  );
}
