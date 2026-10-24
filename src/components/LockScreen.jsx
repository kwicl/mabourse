import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { LogoMark } from './layout/Logo';
import { useFinance } from '../context/FinanceContext';

/** Écran de déverrouillage quand l'app passe par le gardien Vercel. */
export default function LockScreen() {
  const { unlock, error, syncing } = useFinance();
  const [value, setValue] = useState('');
  const [tried, setTried] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!value) return;
    setTried(true);
    await unlock(value);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="glass animate-scale-in w-full max-w-sm p-8 text-center">
        <div className="flex justify-center">
          <LogoMark size={72} />
        </div>
        <h1 className="serif mt-5 text-[34px] leading-tight">
          m<span className="font-semibold">ABOU</span>rse
        </h1>
        <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">Entrez votre mot de passe</p>

        <div className="relative mt-6">
          <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Mot de passe"
            className="input !pl-11 text-center"
          />
        </div>

        {tried && error && !syncing && <p className="mt-3 text-sm text-expense">{error}</p>}

        <button type="submit" disabled={syncing || !value} className="btn mt-5 w-full bg-accent !py-3 text-white shadow-glow hover:bg-[#B84E2E]">
          {syncing ? <Loader2 size={16} className="animate-spin" /> : 'Déverrouiller'}
        </button>
      </form>
    </div>
  );
}
