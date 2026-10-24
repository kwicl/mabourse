/**
 * sheetService — couche d'accès aux données.
 *
 * Mode "sheets" : appelle la Web App Google Apps Script (voir google-apps-script/Code.gs).
 * Mode "local"  : aucune URL configurée -> données factices persistées dans localStorage.
 *
 * Feuilles : Transactions, Categories, Budgets, Accounts.
 * Toutes les méthodes renvoient des Promises.
 */
import { getConfig } from '../config';
import { buildMockDatabase } from '../data/mockData';

export const SHEETS = {
  TRANSACTIONS: 'Transactions',
  CATEGORIES: 'Categories',
  BUDGETS: 'Budgets',
  ACCOUNTS: 'Accounts',
};

const LOCAL_DB_KEY = 'mabourse-local-db';

export function isRemote() {
  return Boolean(getConfig().sheetsUrl);
}

export function uid() {
  return (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

/* ------------------------------------------------------------------ */
/* Remote (Google Apps Script)                                          */
/* ------------------------------------------------------------------ */

async function remoteGet(params) {
  const { sheetsUrl, sheetsToken } = getConfig();
  const url = new URL(sheetsUrl);
  Object.entries({ ...params, token: sheetsToken }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
  return unwrap(res);
}

async function remotePost(body) {
  const { sheetsUrl, sheetsToken } = getConfig();
  // text/plain évite la requête preflight CORS, non supportée par Apps Script.
  const res = await fetch(sheetsUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, token: sheetsToken }),
  });
  return unwrap(res);
}

async function unwrap(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Erreur Google Sheets');
  return json.data;
}

/* ------------------------------------------------------------------ */
/* Local (mock + localStorage)                                          */
/* ------------------------------------------------------------------ */

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const db = buildMockDatabase();
  saveLocal(db);
  return db;
}

function saveLocal(db) {
  try {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
  } catch {
    /* stockage indisponible : la session reste en mémoire */
  }
}

let memoryDb = null;
const localDb = () => (memoryDb ??= loadLocal());
const delay = (v) => new Promise((r) => setTimeout(() => r(v), 120));

export function resetLocalData() {
  memoryDb = buildMockDatabase();
  saveLocal(memoryDb);
}

/* ------------------------------------------------------------------ */
/* API publique : GET / POST / PUT / DELETE                             */
/* ------------------------------------------------------------------ */

/** GET — toutes les feuilles d'un coup. */
export async function getAll() {
  if (isRemote()) return remoteGet({ action: 'all' });
  return delay(structuredClone(localDb()));
}

/** GET — une feuille. */
export async function list(sheet) {
  if (isRemote()) return remoteGet({ action: 'list', sheet });
  return delay(structuredClone(localDb()[sheet] ?? []));
}

/** POST — créer une ligne. */
export async function create(sheet, data) {
  const row = { id: uid(), ...data };
  if (sheet === SHEETS.TRANSACTIONS && !row.createdAt) row.createdAt = new Date().toISOString();
  if (isRemote()) return remotePost({ action: 'create', sheet, data: row });
  const db = localDb();
  db[sheet] = [...(db[sheet] ?? []), row];
  saveLocal(db);
  return delay(row);
}

/** PUT — mettre à jour une ligne par id. */
export async function update(sheet, id, data) {
  if (isRemote()) return remotePost({ action: 'update', sheet, id, data });
  const db = localDb();
  let updated = null;
  db[sheet] = db[sheet].map((r) => (r.id === id ? (updated = { ...r, ...data, id }) : r));
  if (!updated) throw new Error(`Introuvable : ${id}`);
  saveLocal(db);
  return delay(updated);
}

/** DELETE — supprimer une ligne par id. */
export async function remove(sheet, id) {
  if (isRemote()) return remotePost({ action: 'delete', sheet, id });
  const db = localDb();
  db[sheet] = db[sheet].filter((r) => r.id !== id);
  saveLocal(db);
  return delay({ id, deleted: true });
}

/** Envoie les données factices vers Google Sheets (initialisation). */
export async function seedRemote() {
  const db = buildMockDatabase();
  for (const sheet of [SHEETS.TRANSACTIONS, SHEETS.BUDGETS]) {
    await remotePost({ action: 'bulkCreate', sheet, rows: db[sheet] });
  }
}

/** Relance l'import de l'onglet historique (Feuille 1) côté Apps Script. Renvoie le message du script. */
export async function syncSource() {
  if (!isRemote()) throw new Error('Google Sheets non configuré.');
  return remotePost({ action: 'importSource' });
}

/** Teste la connexion à la Web App. */
export async function ping() {
  await remoteGet({ action: 'list', sheet: SHEETS.CATEGORIES });
  return true;
}
