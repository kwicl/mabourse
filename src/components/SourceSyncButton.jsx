import { useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Loader2, XCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

/** Lance l'import de "Feuille 1" vers Transactions puis recharge l'app. */
export default function SourceSyncButton({ className = 'btn-ghost w-full justify-between !rounded-2xl !px-3 text-xs' }) {
  const { remote, syncSource, importing } = useFinance();
  const [result, setResult] = useState(null); // { ok, msg }

  if (!remote) return null;

  async function run() {
    setResult(null);
    try {
      const msg = await syncSource();
      setResult({ ok: true, msg: String(msg) });
    } catch (e) {
      setResult({ ok: false, msg: e.message });
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button onClick={run} disabled={importing} className={className} title="Réimporte l'onglet Feuille 1 dans l'app">
        <span className="flex items-center gap-2">
          <FileSpreadsheet size={14} />
          {importing ? 'Synchronisation…' : 'Synchroniser Feuille 1'}
        </span>
        {importing && <Loader2 size={14} className="animate-spin" />}
      </button>
      {result && (
        <p className={`flex items-start gap-1.5 px-3 text-[11px] leading-snug ${result.ok ? 'text-income' : 'text-expense'}`}>
          {result.ok ? <CheckCircle2 size={12} className="mt-px shrink-0" /> : <XCircle size={12} className="mt-px shrink-0" />}
          {result.msg}
        </p>
      )}
    </div>
  );
}
