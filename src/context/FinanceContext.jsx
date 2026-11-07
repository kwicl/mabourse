import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../services/sheetService';
import { KEY_BY_SHEET, applyOps, enqueue, loadCache, loadQueue, saveCache, saveQueue } from '../services/offlineStore';
import { setPassword } from '../config';

const { SHEETS } = api;
const FinanceContext = createContext(null);


const EMPTY = { transactions: [], categories: [], budgets: [], accounts: [] };

/** Données de départ : dernier état connu (cache) + opérations encore en attente -> l'app s'ouvre même sans réseau. */
function initialState() {
  if (!api.isRemote()) return { data: EMPTY, queue: [], cached: false };
  const queue = loadQueue();
  const cache = loadCache();
  return { data: cache ? applyOps({ ...EMPTY, ...cache }, queue) : EMPTY, queue, cached: Boolean(cache) };
}

export function FinanceProvider({ children }) {
  const init = useRef(null);
  if (!init.current) init.current = initialState();

  const [data, setData] = useState(init.current.data);
  const [status, setStatus] = useState(init.current.cached ? 'ready' : 'loading'); // loading | ready | error | locked
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);
  const [pending, setPending] = useState(init.current.queue.length);

  const dataRef = useRef(init.current.data);
  const queueRef = useRef(init.current.queue);
  const inflightRef = useRef(null);
  const flushingRef = useRef(false);

  const commit = useCallback((next) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const setQueue = useCallback((q) => {
    queueRef.current = q;
    saveQueue(q);
    setPending(q.length);
  }, []);

  /** Envoie les opérations en attente, dans l'ordre. S'arrête au premier échec réseau (réessai plus tard). */
  const flush = useCallback(async () => {
    if (flushingRef.current || !api.isRemote()) return;
    flushingRef.current = true;
    setSyncing(true);
    try {
      while (queueRef.current.length) {
        const op = queueRef.current[0];
        inflightRef.current = op.opId;
        try {
          if (op.action === 'create') await api.create(op.sheet, op.data);
          else if (op.action === 'update') await api.update(op.sheet, op.id, op.data);
          else await api.remove(op.sheet, op.id);
        } catch (e) {
          const alreadyGone = op.action === 'delete' && /introuvable/i.test(e.message);
          if (!alreadyGone) {
            if (e.code === 'unauthorized' || api.isRetryable(e)) throw e;
            // Refus définitif du serveur : on abandonne cette opération pour ne pas bloquer les suivantes
            setError(e.message);
          }
        }
        setQueue(queueRef.current.filter((q) => q.opId !== op.opId));
      }
      setOffline(false);
    } catch (e) {
      if (e.code === 'unauthorized') setStatus('locked');
      else setOffline(true);
      throw e;
    } finally {
      inflightRef.current = null;
      flushingRef.current = false;
      setSyncing(false);
    }
  }, [setQueue]);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      if (api.isRemote()) await flush().catch((e) => { if (e.code === 'unauthorized') throw e; });
      const all = await api.getAll();
      const fresh = {
        transactions: all[SHEETS.TRANSACTIONS] ?? [],
        categories: all[SHEETS.CATEGORIES] ?? [],
        budgets: all[SHEETS.BUDGETS] ?? [],
        accounts: all[SHEETS.ACCOUNTS] ?? [],
      };
      if (api.isRemote()) saveCache(fresh);
      // Les opérations pas encore envoyées restent visibles par-dessus les données du serveur
      commit(applyOps(fresh, queueRef.current));
      setStatus('ready');
      setError(null);
      setOffline(false);
    } catch (e) {
      if (e.code === 'unauthorized') {
        setError(e.message);
        setStatus('locked');
      } else if (api.isRemote() && api.isRetryable(e)) {
        // Pas de réseau : on continue avec les données locales, la synchro reprendra toute seule
        setOffline(true);
        setStatus((s) => (s === 'loading' || s === 'locked' ? (loadCache() || dataRef.current.transactions.length ? 'ready' : 'error') : s));
        if (!loadCache()) setError(e.message);
      } else {
        setError(e.message);
        setStatus((s) => (s === 'loading' || s === 'locked' ? 'error' : s));
      }
    } finally {
      setSyncing(false);
    }
  }, [commit, flush]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reprise automatique : retour du réseau, retour sur l'app, et réessai périodique s'il reste des opérations
  useEffect(() => {
    if (!api.isRemote()) return undefined;
    const onOnline = () => refresh();
    const onOffline = () => setOffline(true);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && queueRef.current.length) flush().catch(() => {});
    };
    const timer = setInterval(() => {
      if (queueRef.current.length && navigator.onLine !== false) flush().catch(() => {});
    }, 30000);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, flush]);

  // Gardien Vercel : enregistre le mot de passe sur l'appareil puis recharge.
  const unlock = useCallback(
    (password) => {
      setPassword(password);
      return refresh();
    },
    [refresh],
  );
  const lock = useCallback(() => {
    setPassword('');
    setStatus('locked');
    setError(null);
  }, []);

  // Réimporte "Feuille 1" dans Transactions, puis recharge les données.
  const [importing, setImporting] = useState(false);
  const syncSource = useCallback(async () => {
    setImporting(true);
    try {
      const msg = await api.syncSource();
      await refresh();
      return msg;
    } finally {
      setImporting(false);
    }
  }, [refresh]);

  // Mode local (sans Google Sheets) : mise à jour optimiste puis écriture ; rollback en cas d'échec.
  const mutateLocal = useCallback(
    async (sheet, optimistic, request) => {
      const key = KEY_BY_SHEET[sheet];
      const snapshot = dataRef.current[key];
      commit({ ...dataRef.current, [key]: optimistic(snapshot) });
      try {
        return await request();
      } catch (e) {
        commit({ ...dataRef.current, [key]: snapshot });
        setError(e.message);
        throw e;
      }
    },
    [commit],
  );

  // Mode Google Sheets : saisie toujours immédiate (hors-ligne compris), envoi en arrière-plan via la file d'attente.
  const mutateQueued = useCallback(
    (sheet, optimistic, op) => {
      const key = KEY_BY_SHEET[sheet];
      const next = { ...dataRef.current, [key]: optimistic(dataRef.current[key]) };
      commit(next);
      saveCache(next);
      setQueue(enqueue(queueRef.current, { opId: api.uid(), sheet, ts: Date.now(), ...op }, inflightRef.current));
      if (navigator.onLine !== false) flush().catch(() => {});
      return Promise.resolve(op.data);
    },
    [commit, flush, setQueue],
  );

  const crud = useCallback(
    (sheet) => ({
      add: async (row) => {
        const full = { id: api.uid(), ...row };
        if (sheet === SHEETS.TRANSACTIONS && !full.createdAt) full.createdAt = new Date().toISOString();
        if (!api.isRemote()) return mutateLocal(sheet, (rows) => [...rows, full], () => api.create(sheet, full));
        return mutateQueued(sheet, (rows) => [...rows, full], { action: 'create', id: full.id, data: full });
      },
      update: (id, patch) => {
        const opt = (rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
        if (!api.isRemote()) return mutateLocal(sheet, opt, () => api.update(sheet, id, patch));
        return mutateQueued(sheet, opt, { action: 'update', id, data: patch });
      },
      remove: (id) => {
        const opt = (rows) => rows.filter((r) => r.id !== id);
        if (!api.isRemote()) return mutateLocal(sheet, opt, () => api.remove(sheet, id));
        return mutateQueued(sheet, opt, { action: 'delete', id, data: {} });
      },
    }),
    [mutateLocal, mutateQueued],
  );

  const value = useMemo(
    () => ({
      ...data,
      status,
      error,
      syncing,
      online: !offline,
      pending,
      flush,
      remote: api.isRemote(),
      proxy: api.usesProxy(),
      unlock,
      lock,
      refresh,
      syncSource,
      importing,
      tx: crud(SHEETS.TRANSACTIONS),
      budgetsApi: crud(SHEETS.BUDGETS),
      categoriesApi: crud(SHEETS.CATEGORIES),
      accountsApi: crud(SHEETS.ACCOUNTS),
      // Une même catégorie peut exister en dépense et en revenu : le type départage
      categoryById: (id, type) =>
        data.categories.find((c) => c.id === id && (!type || c.type === type)) ?? data.categories.find((c) => c.id === id),
      accountById: (id) => data.accounts.find((a) => a.id === id),
    }),
    [data, status, error, syncing, offline, pending, flush, refresh, syncSource, importing, unlock, lock, crud],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance doit être utilisé dans <FinanceProvider>');
  return ctx;
}
