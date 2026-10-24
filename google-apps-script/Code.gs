/**
 * mABOUrse — Backend Google Sheets (Google Apps Script Web App)
 *
 * Installation :
 *  1. Créer un Google Sheet vide.
 *  2. Extensions > Apps Script, coller ce fichier dans Code.gs.
 *  3. Exécuter une fois la fonction setup() (autoriser l'accès) : crée les feuilles
 *     Transactions, Categories, Budgets, Accounts avec leurs en-têtes et des catégories par défaut.
 *  4. Paramètres du projet > Propriétés du script : ajouter API_TOKEN = <un secret long>.
 *  5. Déployer > Nouveau déploiement > Type "Application Web"
 *       - Exécuter en tant que : Moi
 *       - Qui a accès : Tout le monde
 *     Copier l'URL /exec dans VITE_SHEETS_URL (ou dans Réglages de l'app).
 *
 * API :
 *  GET  ?action=all&token=...                      -> { ok, data: { Transactions: [...], ... } }
 *  GET  ?action=list&sheet=Transactions&token=...  -> { ok, data: [...] }
 *  POST body (text/plain JSON) :
 *       { token, action: 'create', sheet, data }
 *       { token, action: 'update', sheet, id, data }
 *       { token, action: 'delete', sheet, id }
 *       { token, action: 'bulkCreate', sheet, rows: [...] }
 *       { token, action: 'importSource' }   -> relance importFeuille1()
 */

var SCHEMA = {
  Transactions: ['id', 'date', 'type', 'amount', 'categoryId', 'accountId', 'toAccountId', 'note', 'createdAt'],
  Categories: ['id', 'name', 'type', 'icon', 'color'],
  Budgets: ['id', 'categoryId', 'amount'],
  Accounts: ['id', 'name', 'type', 'initialBalance', 'color'],
};

var NUMERIC = { amount: true, initialBalance: true };

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = SCHEMA[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });

  var cats = ss.getSheetByName('Categories');
  if (cats.getLastRow() < 2) {
    var defaults = [
      ['food', 'Alimentation', 'expense', 'ShoppingBasket', '#f59e0b'],
      ['restaurant', 'Restaurants', 'expense', 'UtensilsCrossed', '#f97316'],
      ['transport', 'Transport', 'expense', 'Car', '#3b82f6'],
      ['housing', 'Logement', 'expense', 'Home', '#8b5cf6'],
      ['bills', 'Factures', 'expense', 'Zap', '#eab308'],
      ['shopping', 'Shopping', 'expense', 'ShoppingBag', '#ec4899'],
      ['health', 'Santé', 'expense', 'HeartPulse', '#ef4444'],
      ['leisure', 'Loisirs', 'expense', 'Gamepad2', '#06b6d4'],
      ['travel', 'Voyages', 'expense', 'Plane', '#14b8a6'],
      ['education', 'Éducation', 'expense', 'GraduationCap', '#6366f1'],
      ['salary', 'Salaire', 'income', 'Briefcase', '#10b981'],
      ['freelance', 'Freelance', 'income', 'Laptop', '#22c55e'],
      ['investment', 'Investissements', 'income', 'TrendingUp', '#84cc16'],
      ['gift', 'Cadeaux', 'income', 'Gift', '#a855f7'],
    ];
    cats.getRange(2, 1, defaults.length, defaults[0].length).setValues(defaults);
  }

  var acc = ss.getSheetByName('Accounts');
  if (acc.getLastRow() < 2) {
    acc.getRange(2, 1, 2, 5).setValues([
      ['main', 'Compte courant', 'bank', 0, '#5b5bf6'],
      ['cash', 'Espèces', 'cash', 0, '#10b981'],
    ]);
  }
}

/** Génère API_TOKEN (s'il n'existe pas) dans les propriétés du script et l'affiche dans le journal. */
function createApiToken() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('API_TOKEN');
  if (!token) {
    token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty('API_TOKEN', token);
  }
  Logger.log('API_TOKEN=' + token);
}

/* ---------- Import depuis l'onglet historique ---------- */

/**
 * Convertit l'onglet source (saisie historique) vers Transactions / Categories / Accounts.
 * L'onglet source n'est jamais modifié. Relançable : les lignes importées (id "imp-…") sont remplacées,
 * les opérations saisies depuis l'app sont conservées.
 *
 * Colonnes source : ID | Date | Montant dépensé | Income | Catégorie | Moyen de paiement / sous-catégorie | Description
 */
var IMPORT_SOURCE = 'Feuille 1';
var IMPORT_CASH = 'cash';
var IMPORT_SAVINGS = 'epargne';
// Mouvements internes traités comme des transferts (ids de l'onglet source)
var IMPORT_TRANSFERS = {
  'eae1b303-0b51-41ec-a163-a54c12e18d85': { from: IMPORT_SAVINGS, to: IMPORT_CASH }, // épargne -> espèces
  '8af90793-123b-4b45-b122-de3e8c815944': { from: IMPORT_CASH, to: IMPORT_SAVINGS }, // espèces -> investissement
};
var IMPORT_PALETTE = ['#5b5bf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#14b8a6', '#84cc16', '#a855f7', '#eab308', '#6366f1'];

function importFeuille1() {
  setup();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = ss.getSheetByName(IMPORT_SOURCE);
  if (!src) throw new Error('Onglet source absent : ' + IMPORT_SOURCE);
  var tz = Session.getScriptTimeZone();
  var values = src.getDataRange().getValues().slice(1);

  var categories = {};
  var tx = [];
  var skipped = [];

  values.forEach(function (r, i) {
    var srcId = String(r[0]).trim();
    var date = importDate_(r[1], tz);
    var spent = importNum_(r[2]);
    var income = importNum_(r[3]);
    var catName = String(r[4] || '').trim();
    var note = [String(r[5] || '').trim(), String(r[6] || '').trim()].filter(String).join(' · ');
    var base = 'imp-' + (i + 2);
    if (!date) return skipped.push(i + 2);
    if (!spent && !income) return;

    var transfer = IMPORT_TRANSFERS[srcId];
    if (transfer) {
      tx.push([base, date, 'transfer', spent || income, '', transfer.from, transfer.to, note || catName, '']);
      return;
    }
    // Ligne "dépense 1 + revenu" : seul le revenu compte
    if (spent && income && spent <= 1) spent = 0;
    // Note vide : reprend le nom de la catégorie
    if (spent) {
      var ce = importCategory_(categories, catName || 'Autre', 'expense');
      tx.push([income ? base + '-e' : base, date, 'expense', spent, ce, IMPORT_CASH, '', note || catName || 'Autre', '']);
    }
    if (income) {
      var ci = importCategory_(categories, catName || 'Autres revenus', 'income');
      tx.push([spent ? base + '-i' : base, date, 'income', income, ci, IMPORT_CASH, '', note || catName || 'Autres revenus', '']);
    }
  });

  // Catégories et comptes : remplacés par ceux issus de l'historique
  var catRows = Object.keys(categories).map(function (k) { return categories[k]; });
  rewrite_(ss.getSheetByName('Categories'), SCHEMA.Categories.length, catRows);
  rewrite_(ss.getSheetByName('Accounts'), SCHEMA.Accounts.length, [
    [IMPORT_CASH, 'Espèces', 'cash', 0, '#10b981'],
    [IMPORT_SAVINGS, 'Épargne / Investissement', 'savings', 0, '#5b5bf6'],
  ]);

  // Transactions : remplace les lignes importées, garde celles saisies dans l'app
  var txSheet = ss.getSheetByName('Transactions');
  var kept = txSheet.getLastRow() > 1
    ? txSheet.getRange(2, 1, txSheet.getLastRow() - 1, SCHEMA.Transactions.length).getValues()
        .filter(function (row) { return row[0] !== '' && String(row[0]).indexOf('imp-') !== 0; })
        // Anciennes saisies : retire le préfixe exp- / inc- de la catégorie
        .map(function (row) { row[4] = String(row[4]).replace(/^(exp|inc)-/, ''); return row; })
    : [];
  var now = new Date().toISOString();
  tx.forEach(function (row) { row[8] = now; });
  txSheet.getRange('B:B').setNumberFormat('@'); // dates conservées en texte ISO
  rewrite_(txSheet, SCHEMA.Transactions.length, tx.concat(kept));

  var msg = tx.length + ' opérations importées, ' + catRows.length + ' catégories'
    + (skipped.length ? ', lignes ignorées (date illisible) : ' + skipped.join(', ') : '');
  Logger.log(msg);
  return msg;
}

function importDate_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  var s = String(v || '').trim();
  var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function importNum_(v) {
  if (typeof v === 'number') return v;
  return Number(String(v || '').replace(/\s/g, '').replace(',', '.')) || 0;
}

function importCategory_(map, name, type) {
  var slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // id lisible sans préfixe ; dépense et revenu de même nom se distinguent par la colonne type
  var key = type + ':' + slug;
  if (!map[key]) {
    var n = Object.keys(map).length;
    map[key] = [slug, name, type, importIcon_(slug, type), IMPORT_PALETTE[n % IMPORT_PALETTE.length]];
  }
  return slug;
}

function importIcon_(slug, type) {
  var rules = [
    [/salaire/, 'Briefcase'], [/invest|bourse|action/, 'TrendingUp'], [/cafe/, 'Coffee'],
    [/aliment/, 'ShoppingBasket'], [/villa|appart|maison/, 'Home'], [/educ|enfant/, 'GraduationCap'],
    [/sante|bien/, 'HeartPulse'], [/voyage/, 'Plane'], [/deplacement/, 'Car'], [/it-|techno/, 'Laptop'],
    [/electro/, 'Zap'], [/loisir/, 'Gamepad2'], [/vetement/, 'ShoppingBag'],
  ];
  for (var i = 0; i < rules.length; i++) if (rules[i][0].test(slug)) return rules[i][1];
  return type === 'income' ? 'Wallet' : 'Circle';
}

function rewrite_(sh, width, rows) {
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, width).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, width).setValues(rows);
}

/* ---------- HTTP ---------- */

function doGet(e) {
  return handle_(function () {
    var p = e.parameter || {};
    checkToken_(p.token);
    if (p.action === 'list') return readSheet_(p.sheet);
    // 'all' par défaut
    var out = {};
    Object.keys(SCHEMA).forEach(function (name) { out[name] = readSheet_(name); });
    return out;
  });
}

function doPost(e) {
  return handle_(function () {
    var body = JSON.parse(e.postData.contents || '{}');
    checkToken_(body.token);
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      switch (body.action) {
        case 'create': return createRow_(body.sheet, body.data);
        case 'bulkCreate': return (body.rows || []).map(function (r) { return createRow_(body.sheet, r); });
        case 'update': return updateRow_(body.sheet, body.id, body.data);
        case 'delete': return deleteRow_(body.sheet, body.id);
        case 'importSource': return importFeuille1();
        default: throw new Error('Action inconnue : ' + body.action);
      }
    } finally {
      lock.releaseLock();
    }
  });
}

/* ---------- CRUD ---------- */

function sheet_(name) {
  if (!SCHEMA[name]) throw new Error('Feuille inconnue : ' + name);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Feuille absente, exécutez setup() : ' + name);
  return sh;
}

function readSheet_(name) {
  var sh = sheet_(name);
  var headers = SCHEMA[name];
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  return values
    .filter(function (row) { return row[0] !== ''; })
    .map(function (row) { return toObject_(headers, row); });
}

function createRow_(name, data) {
  var sh = sheet_(name);
  var headers = SCHEMA[name];
  data = data || {};
  if (!data.id) data.id = Utilities.getUuid();
  if (name === 'Transactions' && !data.createdAt) data.createdAt = new Date().toISOString();
  sh.appendRow(headers.map(function (h) { return data[h] !== undefined ? data[h] : ''; }));
  return toObject_(headers, headers.map(function (h) { return data[h] !== undefined ? data[h] : ''; }));
}

function updateRow_(name, id, data) {
  var sh = sheet_(name);
  var headers = SCHEMA[name];
  var rowIndex = findRow_(sh, id);
  var current = sh.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var merged = headers.map(function (h, i) {
    return data && data[h] !== undefined && h !== 'id' ? data[h] : current[i];
  });
  sh.getRange(rowIndex, 1, 1, headers.length).setValues([merged]);
  return toObject_(headers, merged);
}

function deleteRow_(name, id) {
  var sh = sheet_(name);
  sh.deleteRow(findRow_(sh, id));
  return { id: id, deleted: true };
}

function findRow_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) throw new Error('Introuvable : ' + id);
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  throw new Error('Introuvable : ' + id);
}

/* ---------- Utils ---------- */

function toObject_(headers, row) {
  var o = {};
  headers.forEach(function (h, i) {
    var v = row[i];
    if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (NUMERIC[h]) v = Number(v) || 0;
    o[h] = v;
  });
  return o;
}

function checkToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (expected && token !== expected) throw new Error('Jeton invalide');
}

function handle_(fn) {
  var out;
  try {
    out = { ok: true, data: fn() };
  } catch (err) {
    out = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
