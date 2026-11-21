import { useCallback, useMemo, useState } from 'react';
import { Building2, CandlestickChart, CloudOff, Coins, Eye, EyeOff, HandCoins, Landmark, Percent, Plus, ShieldCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import Segmented from '../components/ui/Segmented';
import Amount from '../components/ui/Amount';
import AssetForm from '../components/wealth/AssetForm';
import RealEstate, { GainPill } from '../components/wealth/RealEstate';
import Markets from '../components/wealth/Markets';
import { AllocationBar, WealthChart } from '../components/wealth/WealthCharts';
import { useFinance } from '../context/FinanceContext';
import { totalBalance } from '../utils/stats';
import { money } from '../utils/format';
import { wealthHistory, wealthTotals } from '../utils/wealth';

const TAB_KEY = 'mabourse-wealth-tab';
const HIDE_KEY = 'mabourse-hide-private'; // même réglage que le tableau de bord
const TABS = [
  { value: 'overview', label: "Vue d'ensemble" },
  { value: 'realestate', label: 'Immobilier' },
  { value: 'markets', label: 'Bourse & Or' },
];
const read = (k, fallback) => {
  try {
    return localStorage.getItem(k) ?? fallback;
  } catch {
    return fallback;
  }
};
const store = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* stockage indisponible */
  }
};

/** Tuile d'indicateur. */
function Insight({ icon: Icon, label, value, hint, tone = '' }) {
  return (
    <div className="glass animate-fade-up flex min-w-0 flex-col gap-3 p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-fg/10 text-accent">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="label truncate">{label}</p>
        <p className={`serif mt-1 truncate text-[24px] leading-tight ${tone}`}>{value}</p>
        {hint && <p className="mt-1 text-[12px] text-fg-muted">{hint}</p>}
      </div>
    </div>
  );
}

/** Premières briques quand le patrimoine est vide. */
function Starter({ onAdd }) {
  const items = [
    { kind: 'property', icon: Building2, title: 'Un bien immobilier', text: 'Valeur, crédit restant, loyers : votre part réelle et votre rendement.' },
    { kind: 'stock', icon: CandlestickChart, title: 'Une position en bourse', text: 'Actions, ETF, OPCVM : plus-value latente et poids de chaque ligne.' },
    { kind: 'gold', icon: Coins, title: "De l'or", text: 'Lingots, pièces, bijoux : revalorisés au cours du jour en un geste.' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map(({ kind, icon: Icon, title, text }) => (
        <button key={kind} type="button" onClick={() => onAdd(kind)} className="glass glass-hover animate-fade-up flex flex-col items-start gap-3 p-6 text-left">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Icon size={22} />
          </span>
          <span className="text-[15px] font-semibold">{title}</span>
          <span className="text-[13px] text-fg-muted">{text}</span>
          <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[13px] font-medium text-accent">
            <Plus size={14} /> Ajouter
          </span>
        </button>
      ))}
    </div>
  );
}

function Overview({ hidden, onAdd }) {
  const { assets, valuations, accounts, transactions } = useFinance();
  const liquidity = useMemo(() => totalBalance(accounts, transactions), [accounts, transactions]);
  const t = useMemo(() => wealthTotals(assets, liquidity), [assets, liquidity]);
  const history = useMemo(() => wealthHistory(assets, valuations), [assets, valuations]);
  const mask = (v) => (hidden ? '••••' : v);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        {/* Patrimoine net */}
        <div className="glass animate-fade-up relative flex min-w-0 flex-col gap-6 overflow-hidden p-6 sm:p-8 xl:col-span-2">
          <div>
            <p className="label">Patrimoine net</p>
            <Amount value={t.net} hidden={hidden} className="serif mt-2 block text-[44px] leading-none sm:text-[52px]" />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">
              {t.invested > 0 && <GainPill value={t.gain} ratio={t.gainPct} hidden={hidden} />}
              <span>
                Plus-value latente <span className="font-semibold text-fg">{mask(money(t.gain))}</span>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-fg/10 pt-5">
            <div>
              <p className="label">Actifs bruts</p>
              <Amount value={t.gross} hidden={hidden} className="serif mt-1 block text-[20px]" />
            </div>
            <div>
              <p className="label">Dettes</p>
              <Amount value={t.debt} sign={t.debt ? '−' : ''} hidden={hidden} className="serif mt-1 block text-[20px]" />
            </div>
          </div>
          <AllocationBar
            hidden={hidden}
            parts={[
              { key: 'property', value: t.property },
              { key: 'stock', value: t.stock },
              { key: 'gold', value: t.gold },
              { key: 'liquidity', value: Math.max(0, liquidity) },
            ]}
          />
        </div>

        <Card className="xl:col-span-3" title="Évolution des actifs" subtitle="Immobilier, bourse et or, empilés">
          {history.length > 1 ? (
            <WealthChart data={history} hidden={hidden} />
          ) : (
            <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center text-fg-muted">
              <Landmark size={26} strokeWidth={1.5} />
              <p className="max-w-xs text-[13px]">La courbe se construit à chaque mise à jour d'une valeur : revenez revaloriser vos biens et vos cours.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Insight
          icon={HandCoins}
          label="Loyers nets / mois"
          value={mask(money(t.rent - t.charges))}
          hint={t.rent ? `${money(t.rent)} de loyers bruts` : 'Aucun bien loué'}
          tone={t.rent - t.charges >= 0 ? '' : 'text-error'}
        />
        <Insight icon={Percent} label="Rendement locatif net" value={t.rent ? `${(t.netYield * 100).toFixed(1)} %` : '—'} hint="Biens loués, sur le prix d'achat" />
        <Insight
          icon={Landmark}
          label="Endettement"
          value={t.property ? `${Math.round(t.ltv * 100)} %` : '—'}
          hint={t.property ? (t.ltv < 0.5 ? 'Crédit / valeur des biens : confortable' : 'Crédit / valeur des biens : élevé') : 'Aucun bien'}
          tone={t.ltv >= 0.8 ? 'text-error' : ''}
        />
        <Insight
          icon={ShieldCheck}
          label="Part en or"
          value={t.assetsValue ? `${Math.round((t.gold / t.assetsValue) * 100)} %` : '—'}
          hint="Valeur refuge, souvent visée entre 5 et 15 %"
        />
      </div>

      {!assets.length && <Starter onAdd={onAdd} />}
    </div>
  );
}

export default function Wealth() {
  const { wealthSynced, remote } = useFinance();
  const [tab, setTab] = useState(() => {
    const v = read(TAB_KEY, 'overview');
    return TABS.some((x) => x.value === v) ? v : 'overview';
  });
  const [hidden, setHidden] = useState(() => read(HIDE_KEY, '0') === '1');
  const [form, setForm] = useState({ open: false, initial: null, kind: 'property' });

  const changeTab = (v) => {
    setTab(v);
    store(TAB_KEY, v);
  };
  const toggleHidden = () =>
    setHidden((h) => {
      store(HIDE_KEY, h ? '0' : '1');
      return !h;
    });
  const onAdd = useCallback((kind) => setForm({ open: true, initial: null, kind }), []);
  const onEdit = useCallback((a) => setForm({ open: true, initial: a, kind: a.kind }), []);
  const close = useCallback(() => setForm((f) => ({ ...f, open: false })), []);
  const addKind = tab === 'markets' ? 'stock' : 'property';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <Segmented options={TABS} value={tab} onChange={changeTab} />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleHidden} className="btn-ghost h-10 w-10 !p-0" aria-label={hidden ? 'Afficher les montants' : 'Masquer les montants'}>
            {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button type="button" onClick={() => onAdd(addKind)} className="btn water-glow">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {remote && !wealthSynced && (
        <p className="glass flex items-start gap-2 p-4 text-[13px] text-fg-muted">
          <CloudOff size={16} className="mt-0.5 shrink-0" />
          Patrimoine enregistré sur cet appareil : redéployez le script Google à jour (google-apps-script/Code.gs) pour le synchroniser. Il sera envoyé automatiquement.
        </p>
      )}

      {tab === 'overview' && <Overview hidden={hidden} onAdd={onAdd} />}
      {tab === 'realestate' && <RealEstate hidden={hidden} onAdd={onAdd} onEdit={onEdit} />}
      {tab === 'markets' && <Markets hidden={hidden} onAdd={onAdd} onEdit={onEdit} />}

      <AssetForm open={form.open} initial={form.initial} kind={form.kind} onClose={close} />
    </div>
  );
}
