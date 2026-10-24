import { useState } from 'react';
import { CheckCircle2, Database, Loader2, Lock, RotateCcw, Upload, XCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import { getConfig, saveConfig } from '../config';
import { ping, resetLocalData, seedRemote } from '../services/sheetService';
import { useFinance } from '../context/FinanceContext';
import SourceSyncButton from '../components/SourceSyncButton';

export default function Settings() {
  const { refresh, remote, proxy, lock } = useFinance();
  const [cfg, setCfg] = useState(getConfig);
  const [state, setState] = useState({ busy: false, msg: '', ok: null });

  const run = async (fn, okMsg) => {
    setState({ busy: true, msg: '', ok: null });
    try {
      await fn();
      setState({ busy: false, msg: okMsg, ok: true });
    } catch (e) {
      setState({ busy: false, msg: e.message, ok: false });
    }
  };

  const save = () =>
    run(async () => {
      saveConfig(cfg);
      if (cfg.sheetsUrl) await ping();
      await refresh();
    }, cfg.sheetsUrl ? 'Connecté à Google Sheets.' : 'Mode local activé.');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {proxy && (
        <Card title="Accès sécurisé" subtitle="Connecté à Google Sheets via le serveur Vercel ; le jeton ne quitte jamais le serveur.">
          <button onClick={lock} className="btn-primary">
            <Lock size={16} /> Verrouiller l'app sur cet appareil
          </button>
        </Card>
      )}

      <Card title="Google Sheets" subtitle="Base de données de l'application">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="label">URL de la Web App (…/exec)</span>
            <input
              value={cfg.sheetsUrl}
              onChange={(e) => setCfg({ ...cfg, sheetsUrl: e.target.value.trim() })}
              placeholder="https://script.google.com/macros/s/…/exec"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Jeton API (API_TOKEN)</span>
            <input type="password" value={cfg.sheetsToken} onChange={(e) => setCfg({ ...cfg, sheetsToken: e.target.value })} className="input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Devise</span>
            <select value={cfg.currency} onChange={(e) => setCfg({ ...cfg, currency: e.target.value })} className="input">
              {['MAD', 'EUR', 'USD', 'GBP', 'CAD', 'CHF'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <button onClick={save} disabled={state.busy} className="btn-primary">
              {state.busy ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} Enregistrer & tester
            </button>
            {remote && (
              <button
                onClick={() => window.confirm('Ajouter les données de démonstration dans Google Sheets ?') && run(async () => { await seedRemote(); await refresh(); }, 'Données de démo importées.')}
                disabled={state.busy}
                className="btn-ghost"
              >
                <Upload size={16} /> Importer la démo
              </button>
            )}
            {!remote && (
              <button
                onClick={() => window.confirm('Réinitialiser les données locales ?') && run(async () => { resetLocalData(); await refresh(); }, 'Données locales réinitialisées.')}
                className="btn-ghost"
              >
                <RotateCcw size={16} /> Réinitialiser la démo
              </button>
            )}
          </div>

          {state.msg && (
            <p className={`flex items-center gap-2 text-sm ${state.ok ? 'text-income' : 'text-expense'}`}>
              {state.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {state.msg}
            </p>
          )}
        </div>
      </Card>

      {remote && (
        <Card title="Historique « Feuille 1 »" subtitle="Réimporte les lignes saisies directement dans le Google Sheet">
          <SourceSyncButton className="btn-primary" />
        </Card>
      )}

      <Card title="Configuration en 5 étapes">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-ink-600 dark:text-ink-300">
          <li>Créez un Google Sheet vide.</li>
          <li>Ouvrez <b>Extensions › Apps Script</b> et collez <code>google-apps-script/Code.gs</code>.</li>
          <li>Exécutez la fonction <code>setup</code> une fois (crée les feuilles Transactions, Categories, Budgets, Accounts).</li>
          <li>Dans <b>Paramètres du projet › Propriétés du script</b>, ajoutez <code>API_TOKEN</code>.</li>
          <li><b>Déployer › Application Web</b> (exécuter en tant que : moi, accès : tout le monde), puis collez l'URL ci-dessus.</li>
        </ol>
      </Card>
    </div>
  );
}
