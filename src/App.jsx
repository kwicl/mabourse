import { useCallback, useState } from 'react';
import { Loader2, Moon, Plus, Sun } from 'lucide-react';
import Sidebar, { MobileNav, NAV } from './components/layout/Sidebar';
import { LogoMark } from './components/layout/Logo';
import TransactionForm from './components/transactions/TransactionForm';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import { useFinance } from './context/FinanceContext';
import { useHashRoute, navigate } from './hooks/useHashRoute';
import { useTheme } from './hooks/useTheme';

const PAGES = { dashboard: Dashboard, transactions: Transactions, budgets: Budgets, stats: Stats, settings: Settings };

function greeting() {
  const h = new Date().getHours();
  return h < 18 ? 'Bonjour' : 'Bonsoir';
}

export default function App() {
  const route = useHashRoute();
  const { theme, toggle } = useTheme();
  const { status, error } = useFinance();
  const [form, setForm] = useState({ open: false, initial: null });

  const openAdd = useCallback(() => setForm({ open: true, initial: null }), []);
  const openEdit = useCallback((t) => setForm({ open: true, initial: t }), []);
  const close = useCallback(() => setForm((f) => ({ ...f, open: false })), []);

  const Page = PAGES[route] ?? Dashboard;
  const nav = NAV.find((n) => n.id === route) ?? NAV[0];
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex min-h-screen">
      <Sidebar route={route} onAdd={openAdd} theme={theme} onToggleTheme={toggle} />

      <main className="mx-auto min-w-0 max-w-[1440px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-12 lg:pb-14 lg:pt-10">
        <header className="mb-7 flex items-end justify-between gap-4 lg:mb-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('settings')} className="lg:hidden" aria-label="Réglages">
              <LogoMark size={38} />
            </button>
            <div>
              <p className="text-[13px] capitalize text-ink-500 dark:text-ink-400">{route === 'dashboard' ? `${greeting()} · ${today}` : today}</p>
              <h1 className="serif mt-0.5 text-[30px] leading-tight sm:text-[40px]">{nav.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-ghost h-10 w-10 !p-0 lg:hidden" aria-label="Changer de thème">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={openAdd} className="btn hidden bg-accent text-white shadow-glow hover:bg-[#B84E2E] sm:inline-flex lg:hidden">
              <Plus size={16} /> Ajouter
            </button>
          </div>
        </header>

        {status === 'loading' && (
          <div className="flex h-[60vh] items-center justify-center text-ink-400">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {status === 'error' && (
          <div className="glass mx-auto max-w-md p-6 text-center">
            <p className="font-medium">Impossible de charger les données</p>
            <p className="mt-1 text-sm text-ink-400">{error}</p>
            <button onClick={() => navigate('settings')} className="btn-primary mt-4">Vérifier les réglages</button>
          </div>
        )}
        {status === 'ready' && <Page key={route} onEdit={openEdit} />}
        {status === 'error' && route === 'settings' && <div className="mt-5"><Settings /></div>}
      </main>

      <MobileNav route={route} onAdd={openAdd} />
      <TransactionForm open={form.open} initial={form.initial} onClose={close} />
    </div>
  );
}
