import { useMemo, useSyncExternalStore } from 'react';
import { PERIODS, periodRange, rangeLabel } from '../utils/periods';

/** Période sélectionnée, commune au tableau de bord et au bandeau, mémorisée sur l'appareil. */

const PERIOD_KEY = 'mabourse-period';
const CUSTOM_KEY = 'mabourse-period-custom';

function read() {
  let key = 'month';
  let custom = null;
  try {
    const k = localStorage.getItem(PERIOD_KEY);
    if (PERIODS.some((p) => p.key === k)) key = k;
    custom = JSON.parse(localStorage.getItem(CUSTOM_KEY)) || null;
  } catch {
    /* stockage indisponible */
  }
  return { key, custom };
}

let state = read();
const listeners = new Set();
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

function update(next) {
  state = next;
  try {
    localStorage.setItem(PERIOD_KEY, next.key);
    if (next.custom) localStorage.setItem(CUSTOM_KEY, JSON.stringify(next.custom));
  } catch {
    /* stockage indisponible */
  }
  listeners.forEach((fn) => fn());
}

const choosePeriod = (key) => update({ ...state, key });
const chooseRange = (from, to) => update({ key: 'custom', custom: { from, to } });

export function usePeriod(transactions) {
  const { key, custom } = useSyncExternalStore(subscribe, () => state);
  const range = useMemo(() => periodRange(key, transactions, custom), [key, transactions, custom]);
  const base = PERIODS.find((p) => p.key === key);
  const period = key === 'custom' ? { ...base, label: rangeLabel(range.from, range.to) } : base;
  return { periodKey: key, period, range, choosePeriod, chooseRange };
}
