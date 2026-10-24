import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/sheetService';
import { setPassword } from '../config';

const { SHEETS } = api;
const FinanceContext = createContext(null);

const KEY_BY_SHEET = {
  [SHEETS.TRANSACTIONS]: 'transactions',
  [SHEETS.CATEGORIES]: 'categories',
  [SHEETS.BUDGETS]: 'budgets',
  [SHEETS.ACCOUNTS]: 'accounts',
};

export function FinanceProvider({ children }) {
  const [data, setData] = useState({ transactions: [], categories: [], budgets: [], accounts: [] });
  const [status, setStatus] = useState('loading'); // loading | ready | error | locked
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const all = await api.getAll();
      setData({
        transactions: all[SHEETS.TRANSACTIONS] ?? [],
        categories: all[SHEETS.CATEGORIES] ?? [],
        budgets: all[SHEETS.BUDGETS] ?? [],
        accounts: all[SHEETS.ACCOUNTS] ?? [],
      });
      setStatus('ready');
      setError(null);
    } catch (e) {
      setError(e.message);
      // Mot de passe absent ou refusé par le gardien : écran de déverrouillage
      if (e.code === 'unauthorized') setStatus('locked');
      else setStatus((s) => (s === 'loading' || s === 'locked' ? 'error' : s));
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  // Mise à jour optimiste puis synchro ; rollback en cas d'échec.
  const mutate = useCallback(async (sheet, optimistic, request) => {
    const key = KEY_BY_SHEET[sheet];
    let snapshot;
    setData((d) => {
      snapshot = d[key];
      return { ...d, [key]: optimistic(d[key]) };
    });
    setSyncing(true);
    try {
      const result = await request();
      setError(null);
      return result;
    } catch (e) {
      setData((d) => ({ ...d, [key]: snapshot }));
      setError(e.message);
      throw e;
    } finally {
      setSyncing(false);
    }
  }, []);

  const crud = useCallback(
    (sheet) => ({
      add: async (row) => {
        const full = { id: api.uid(), ...row };
        return mutate(sheet, (rows) => [...rows, full], () => api.create(sheet, full));
      },
      update: (id, patch) =>
        mutate(sheet, (rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)), () => api.update(sheet, id, patch)),
      remove: (id) => mutate(sheet, (rows) => rows.filter((r) => r.id !== id), () => api.remove(sheet, id)),
    }),
    [mutate],
  );

  const value = useMemo(
    () => ({
      ...data,
      status,
      error,
      syncing,
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
    [data, status, error, syncing, refresh, syncSource, importing, unlock, lock, crud],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance doit être utilisé dans <FinanceProvider>');
  return ctx;
}
