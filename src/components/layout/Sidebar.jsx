import { ArrowLeftRight, BarChart3, LayoutGrid, Moon, Plus, RefreshCw, Settings, Sun, Target } from 'lucide-react';
import Logo from './Logo';
import { navigate } from '../../hooks/useHashRoute';
import { useFinance } from '../../context/FinanceContext';
import SourceSyncButton from '../SourceSyncButton';

export const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', short: 'Accueil', icon: LayoutGrid },
  { id: 'transactions', label: 'Opérations', short: 'Opérations', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', short: 'Budgets', icon: Target },
  { id: 'stats', label: 'Statistiques', short: 'Stats', icon: BarChart3 },
  { id: 'settings', label: 'Réglages', short: 'Réglages', icon: Settings },
];

function SyncBadge() {
  const { remote, syncing, error, refresh } = useFinance();
  const dot = error ? 'bg-expense' : syncing ? 'bg-ochre animate-pulse' : remote ? 'bg-income' : 'bg-ink-300';
  const text = error ? 'Erreur de synchro' : remote ? (syncing ? 'Synchronisation…' : 'Google Sheets') : 'Données locales';
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

export default function Sidebar({ route, onAdd, theme, onToggleTheme }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col gap-9 border-r border-sand-line/70 bg-cream/40 px-5 py-8 backdrop-blur-md dark:border-night-line dark:bg-night/40 lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <button onClick={onAdd} className="btn w-full bg-accent !py-3 text-white shadow-glow hover:bg-[#B84E2E] hover:shadow-lift">
        <Plus size={17} /> Nouvelle opération
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = route === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-300 ease-out ${
                active
                  ? 'bg-white text-ink-900 shadow-soft ring-1 ring-sand-line dark:bg-white/[0.06] dark:text-ink-50 dark:shadow-none dark:ring-night-line'
                  : 'text-ink-500 hover:bg-sand/40 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/[0.03] dark:hover:text-ink-50'
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-all duration-300 ease-out ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <Icon size={17} strokeWidth={active ? 2 : 1.6} className={active ? 'text-accent' : ''} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-sand-line pt-4 dark:border-night-line">
        <SourceSyncButton />
        <SyncBadge />
        <button onClick={onToggleTheme} className="btn-ghost w-full justify-between !rounded-xl !px-3 text-xs">
          <span>{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</span>
          {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ route, onAdd }) {
  const items = NAV.filter((n) => n.id !== 'settings');
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full border border-sand-line bg-cream/85 px-2 py-2 shadow-lift backdrop-blur-md dark:border-night-line dark:bg-night-card/85 lg:hidden">
      {items.slice(0, 2).map((n) => (
        <MobileItem key={n.id} item={n} active={route === n.id} />
      ))}
      <button
        onClick={onAdd}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-glow transition-all duration-300 ease-out active:scale-95"
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
      className={`flex flex-col items-center gap-0.5 px-2 text-[10px] font-medium transition-colors duration-300 ${active ? 'text-accent' : 'text-ink-400'}`}
    >
      <Icon size={19} strokeWidth={active ? 2 : 1.6} />
      {short}
    </button>
  );
}
