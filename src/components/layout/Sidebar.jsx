import { useRef } from 'react';
import { ArrowLeftRight, BarChart3, LayoutGrid, Plus, RefreshCw, Settings, Target } from 'lucide-react';
import Logo from './Logo';
import NavBubble from '../fx/NavBubble';
import { navigate } from '../../hooks/useHashRoute';
import { useFinance } from '../../context/FinanceContext';
import SourceSyncButton from '../SourceSyncButton';
import OriginModeToggle from '../OriginModeToggle';

export const NAV = [
  { id: 'dashboard', label: 'MiZanya', short: 'Accueil', icon: LayoutGrid },
  { id: 'transactions', label: 'Opérations', short: 'Opérations', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', short: 'Budgets', icon: Target },
  { id: 'stats', label: 'Statistiques', short: 'Stats', icon: BarChart3 },
  { id: 'settings', label: 'Réglages', short: 'Réglages', icon: Settings },
];

function SyncBadge() {
  const { remote, syncing, error, refresh, online, pending } = useFinance();
  const dot = !online ? 'bg-warning' : error ? 'bg-error' : syncing || pending ? 'bg-warning animate-pulse' : remote ? 'bg-success' : 'bg-fg-muted';
  const waiting = pending ? ` · ${pending} en attente` : '';
  const text = !remote
    ? 'Données locales'
    : !online
      ? `Hors ligne${waiting}`
      : error
        ? 'Erreur de synchro'
        : syncing
          ? 'Synchronisation…'
          : pending
            ? `${pending} en attente`
            : 'Google Sheets';
  return (
    <button onClick={refresh} className="btn-ghost w-full justify-between !rounded-xl !px-3 text-xs" title={error || 'Actualiser'}>
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {text}
      </span>
      <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
    </button>
  );
}

export default function Sidebar({ route, onAdd }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col gap-9 nav-bar surface-second border-r border-line px-5 py-8 lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <button onClick={onAdd} className="btn water-glow w-full !py-3">
        <Plus size={17} /> Nouvelle opération
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = route === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-300 ease-out ${
                active
                  ? 'bg-accent text-on-accent shadow-soft'
                  : 'text-fg-muted hover:bg-fg/10 hover:text-fg'
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2 : 1.6} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <SourceSyncButton />
        <SyncBadge />
        <OriginModeToggle variant="row" />
      </div>
    </aside>
  );
}

export function MobileNav({ route, onAdd }) {
  const items = NAV.filter((n) => n.id !== 'settings');
  const navRef = useRef(null);
  return (
    <nav ref={navRef} className="nav-bubble-host fixed inset-x-3 bottom-3 z-40 flex items-center justify-around nav-bar surface-second rounded-full border border-line px-2 py-2 shadow-lift lg:hidden">
      <NavBubble navRef={navRef} activeId={route} />
      {items.slice(0, 2).map((n) => (
        <MobileItem key={n.id} item={n} active={route === n.id} />
      ))}
      <button
        onClick={onAdd}
        className="water-glow water-blob flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-out active:scale-95"
        aria-label="Nouvelle opération"
      >
        <Plus size={20} />
      </button>
      {items.slice(2).map((n) => (
        <MobileItem key={n.id} item={n} active={route === n.id} />
      ))}
    </nav>
  );
}

function MobileItem({ item: { id, short, icon: Icon }, active }) {
  return (
    <button
      onClick={() => navigate(id)}
      data-nav-id={id}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col items-center gap-0.5 px-2 text-[10px] font-medium transition-colors duration-300 ${active ? 'text-on-accent' : 'text-fg-muted'}`}
    >
      <Icon size={19} strokeWidth={active ? 2 : 1.6} />
      {short}
    </button>
  );
}
