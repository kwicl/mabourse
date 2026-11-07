/**
 * offlineStore — cache local des données + file d'attente (outbox) des opérations à synchroniser.
 * Permet de saisir hors-ligne : tout est appliqué localement tout de suite, puis envoyé quand la connexion revient.
 */
const CACHE_KEY = 'mabourse-cache-v1';
const QUEUE_KEY = 'mabourse-outbox-v1';

export const KEY_BY_SHEET = {
  Transactions: 'transactions',
  Categories: 'categories',
  Budgets: 'budgets',
  Accounts: 'accounts',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage plein ou indisponible : la session reste en mémoire */
  }
}

export const loadCache = () => read(CACHE_KEY, null);
export const saveCache = (data) => write(CACHE_KEY, data);
export const loadQueue = () => read(QUEUE_KEY, []);
export const saveQueue = (queue) => write(QUEUE_KEY, queue);

/** Rejoue les opérations en attente sur des données (idempotent : peut être appliqué plusieurs fois). */
export function applyOps(data, ops) {
  let next = data;
  for (const op of ops) {
    const key = KEY_BY_SHEET[op.sheet];
    if (!key) continue;
    const rows = next[key] ?? [];
    let out = rows;
    if (op.action === 'create') {
      out = rows.some((r) => r.id === op.id) ? rows.map((r) => (r.id === op.id ? { ...r, ...op.data } : r)) : [...rows, op.data];
    } else if (op.action === 'update') {
      out = rows.map((r) => (r.id === op.id ? { ...r, ...op.data, id: op.id } : r));
    } else if (op.action === 'delete') {
      out = rows.filter((r) => r.id !== op.id);
    }
    next = { ...next, [key]: out };
  }
  return next;
}

/**
 * Ajoute une opération en compactant la file :
 * - update sur un create en attente -> fusionné dans le create
 * - delete d'un create en attente -> les deux disparaissent
 * - update sur update -> fusionnés
 * `inflightId` : opération en cours d'envoi, jamais modifiée.
 */
export function enqueue(queue, op, inflightId) {
  const idx = queue.findIndex((q) => q.sheet === op.sheet && q.id === op.id && q.opId !== inflightId && q.action !== 'delete');
  if (idx >= 0) {
    const prev = queue[idx];
    if (op.action === 'delete') {
      if (prev.action === 'create') return queue.filter((_, i) => i !== idx);
      return [...queue.filter((_, i) => i !== idx), op];
    }
    if (op.action === 'update') {
      const merged = { ...prev, data: { ...prev.data, ...op.data } };
      return queue.map((q, i) => (i === idx ? merged : q));
    }
  }
  return [...queue, op];
}
