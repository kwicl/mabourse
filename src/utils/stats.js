import { monthKey, todayISO } from './format';

const num = (v) => Number(v) || 0;

/** Effet signé d'une transaction sur un compte donné (ou sur le total si accountId absent). */
export function signedAmount(t, accountId) {
  const a = num(t.amount);
  if (t.type === 'income') return !accountId || t.accountId === accountId ? a : 0;
  if (t.type === 'expense') return !accountId || t.accountId === accountId ? -a : 0;
  if (t.type === 'transfer') {
    if (!accountId) return 0;
    if (t.accountId === accountId) return -a;
    if (t.toAccountId === accountId) return a;
  }
  return 0;
}

export function accountBalances(accounts, transactions) {
  return accounts.map((acc) => ({
    ...acc,
    balance: transactions.reduce((s, t) => s + signedAmount(t, acc.id), num(acc.initialBalance)),
  }));
}

export function totalBalance(accounts, transactions, upToISO) {
  const initial = accounts.reduce((s, a) => s + num(a.initialBalance), 0);
  return transactions
    .filter((t) => !upToISO || t.date <= upToISO)
    .reduce((s, t) => s + signedAmount(t), initial);
}

export function monthTotals(transactions, key) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (monthKey(t.date) !== key) continue;
    if (t.type === 'income') income += num(t.amount);
    if (t.type === 'expense') expense += num(t.amount);
  }
  return { income, expense, net: income - expense };
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Série de soldes quotidiens sur `days` jours se terminant aujourd'hui. */
export function balanceSeries(accounts, transactions, days = 30) {
  const end = new Date(`${todayISO()}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const startISO = start.toISOString().slice(0, 10);

  let running = totalBalance(accounts, transactions.filter((t) => t.date < startISO));
  const byDay = {};
  for (const t of transactions) if (t.date >= startISO) byDay[t.date] = (byDay[t.date] || 0) + signedAmount(t);

  const out = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    running += byDay[iso] || 0;
    out.push({ date: iso, balance: Math.round(running * 100) / 100 });
  }
  return out;
}

/**
 * Solde quotidien + revenus/dépenses cumulés sur `days` jours se terminant aujourd'hui.
 * Montants du jour : dayIncome, dayExpense, dayNet (variation du solde, transferts exclus car neutres).
 */
export function flowSeries(accounts, transactions, days = 30) {
  const balance = balanceSeries(accounts, transactions, days);
  const startISO = balance[0]?.date;
  const byDay = {};
  for (const t of transactions) {
    if (t.date < startISO || (t.type !== 'income' && t.type !== 'expense')) continue;
    byDay[t.date] ??= { income: 0, expense: 0 };
    byDay[t.date][t.type] += num(t.amount);
  }
  let income = 0;
  let expense = 0;
  return balance.map((d) => {
    const dayIncome = byDay[d.date]?.income || 0;
    const dayExpense = byDay[d.date]?.expense || 0;
    income += dayIncome;
    expense += dayExpense;
    return {
      ...d,
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      dayIncome,
      dayExpense,
      dayNet: dayIncome - dayExpense,
    };
  });
}

/** Dépenses (ou revenus) par catégorie entre deux dates ISO incluses. */
export function byCategoryRange(transactions, categories, fromISO, toISO, type = 'expense') {
  const map = {};
  for (const t of transactions) {
    if (t.type !== type || t.date < fromISO || t.date > toISO) continue;
    map[t.categoryId] = (map[t.categoryId] || 0) + num(t.amount);
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map)
    .map(([id, value]) => {
      const c = categories.find((x) => x.id === id) || { id, name: 'Autre', color: '#9ca3af', icon: 'Circle' };
      return { ...c, value, share: total ? value / total : 0 };
    })
    .sort((a, b) => b.value - a.value);
}

/** Dépenses (ou revenus) par catégorie pour un mois. */
export function byCategory(transactions, categories, key, type = 'expense') {
  const map = {};
  for (const t of transactions) {
    if (t.type !== type || monthKey(t.date) !== key) continue;
    map[t.categoryId] = (map[t.categoryId] || 0) + num(t.amount);
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map)
    .map(([id, value]) => {
      const c = categories.find((x) => x.id === id) || { id, name: 'Autre', color: '#9ca3af', icon: 'Circle' };
      return { ...c, value, share: total ? value / total : 0 };
    })
    .sort((a, b) => b.value - a.value);
}

/** Revenus / dépenses des `count` derniers mois. */
export function monthlySeries(transactions, count = 6) {
  const current = monthKey(todayISO());
  return Array.from({ length: count }, (_, i) => {
    const key = shiftMonth(current, i - (count - 1));
    return { key, ...monthTotals(transactions, key) };
  });
}
