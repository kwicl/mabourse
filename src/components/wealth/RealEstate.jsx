import { Building2, Home, KeyRound, LandPlot, MapPin, Plus, Store, Briefcase } from 'lucide-react';
import Amount from '../ui/Amount';
import { useFinance } from '../../context/FinanceContext';
import { compact, money, pct } from '../../utils/format';
import { assetHistory, debtOf, gainOf, gainPct, propertyStats, subtypeLabel, valueOf, wealthTotals } from '../../utils/wealth';
import { Sparkline } from './WealthCharts';

const ICONS = { appartement: Building2, villa: Home, maison: Home, terrain: LandPlot, commerce: Store, bureau: Briefcase };

export function Stat({ label, children, tone = '' }) {
  return (
    <div className="min-w-0">
      <p className="label truncate">{label}</p>
      <p className={`serif mt-1 truncate text-[22px] leading-tight sm:text-[26px] ${tone}`}>{children}</p>
    </div>
  );
}

export function GainPill({ value, ratio, hidden }) {
  const up = value >= 0;
  return (
    <span className={`chip !px-2 ${up ? '!text-success' : '!text-error'}`}>
      {up ? '▲' : '▼'} {hidden ? '••' : pct(ratio)}
    </span>
  );
}

function PropertyCard({ a, hidden, onEdit, valuations }) {
  const s = propertyStats(a);
  const Icon = ICONS[a.subtype] ?? Building2;
  const debt = debtOf(a);
  const rented = Number(a.rent) > 0;
  return (
    <button type="button" onClick={() => onEdit(a)} className="glass glass-hover animate-fade-up flex min-w-0 flex-col gap-5 p-6 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{a.name}</p>
            <p className="flex items-center gap-1 truncate text-[12px] text-fg-muted">
              {subtypeLabel(a)}
              {a.location && (
                <>
                  <span>·</span>
                  <MapPin size={11} /> {a.location}
                </>
              )}
            </p>
          </div>
        </div>
        <span className={`chip shrink-0 ${rented ? '' : 'opacity-70'}`}>
          <KeyRound size={11} /> {rented ? 'Loué' : 'Occupé'}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label">Valeur estimée</p>
          <Amount value={valueOf(a)} hidden={hidden} className="serif mt-1 block text-[30px] leading-none" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Sparkline points={assetHistory(a, valuations)} width={88} height={28} />
          <GainPill value={gainOf(a)} ratio={gainPct(a)} hidden={hidden} />
        </div>
      </div>

      {/* Part détenue vs banque */}
      <div>
        <div className="mb-1.5 flex justify-between text-[11px] text-fg-muted">
          <span>
            Vous possédez <span className="font-semibold text-fg">{Math.round(s.ownedShare * 100)} %</span>
          </span>
          {debt > 0 && <span>Banque {hidden ? '••' : compact(debt)}</span>}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-fg/10">
          <div className="h-full rounded-full bg-accent transition-all duration-700 ease-out" style={{ width: `${s.ownedShare * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-fg/10 pt-4 text-[12px]">
        <div>
          <p className="text-fg-muted">Rendement net</p>
          <p className="mt-0.5 font-semibold">{rented ? `${(s.netYield * 100).toFixed(1)} %` : '—'}</p>
        </div>
        <div>
          <p className="text-fg-muted">Cash-flow / mois</p>
          <p className={`mt-0.5 font-semibold ${s.cashflow > 0 ? 'text-success' : s.cashflow < 0 ? 'text-error' : ''}`}>
            {hidden ? '••' : rented || a.charges ? money(s.cashflow) : '—'}
          </p>
        </div>
        <div>
          <p className="text-fg-muted">Prix / m²</p>
          <p className="mt-0.5 font-semibold">{s.perM2 ? (hidden ? '••' : compact(s.perM2)) : '—'}</p>
        </div>
      </div>
    </button>
  );
}

export default function RealEstate({ hidden, onAdd, onEdit }) {
  const { assets, valuations } = useFinance();
  const props = assets.filter((a) => a.kind === 'property').sort((a, b) => valueOf(b) - valueOf(a));
  const t = wealthTotals(props);
  return (
    <div className="flex flex-col gap-5">
      <div className="glass animate-fade-up grid grid-cols-2 gap-5 p-6 sm:p-7 lg:grid-cols-4">
        <Stat label="Valeur du parc">
          <Amount value={t.property} hidden={hidden} />
        </Stat>
        <Stat label="Capital restant dû">
          <Amount value={t.debt} hidden={hidden} />
        </Stat>
        <Stat label="Votre part nette">
          <Amount value={t.property - t.debt} hidden={hidden} />
        </Stat>
        <Stat label="Loyers nets / mois" tone={t.rent - t.charges >= 0 ? 'text-success' : 'text-error'}>
          <Amount value={t.rent - t.charges} hidden={hidden} />
        </Stat>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {props.map((a) => (
          <PropertyCard key={a.id} a={a} hidden={hidden} onEdit={onEdit} valuations={valuations} />
        ))}
        <button
          type="button"
          onClick={() => onAdd('property')}
          className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-fg/20 p-6 text-fg-muted transition hover:border-accent hover:text-fg"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-fg/10">
            <Plus size={22} />
          </span>
          <span className="text-sm font-medium">Ajouter un bien</span>
          <span className="max-w-[240px] text-center text-[12px]">Appartement, villa, terrain… Suivez sa valeur, votre crédit et vos loyers.</span>
        </button>
      </div>
    </div>
  );
}
