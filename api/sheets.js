/**
 * Fonction serverless Vercel : relaie les appels de l'app vers la Web App Google Apps Script.
 * Le jeton API reste côté serveur ; l'app doit présenter le mot de passe (en-tête x-app-password).
 *
 * Variables d'environnement Vercel (sans préfixe VITE_, donc jamais envoyées au navigateur) :
 *   SHEETS_URL    URL /exec de la Web App
 *   SHEETS_TOKEN  valeur de API_TOKEN dans les propriétés du script
 *   APP_PASSWORD  mot de passe demandé à l'ouverture de l'app
 */
import { timingSafeEqual } from 'node:crypto';

const ACTIONS = new Set(['all', 'list', 'create', 'update', 'delete', 'bulkCreate', 'importSource']);

function samePassword(given, expected) {
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

const fail = (res, status, error, code) => res.status(status).json({ ok: false, error, code });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { SHEETS_URL, SHEETS_TOKEN = '', APP_PASSWORD } = process.env;
  if (!SHEETS_URL || !APP_PASSWORD) return fail(res, 503, 'Serveur non configuré (SHEETS_URL / APP_PASSWORD).', 'not_configured');
  if (!samePassword(req.headers['x-app-password'] || '', APP_PASSWORD)) return fail(res, 401, 'Mot de passe incorrect.', 'unauthorized');

  try {
    let upstream;
    if (req.method === 'GET') {
      const { action = 'all', sheet } = req.query;
      if (!ACTIONS.has(action)) return fail(res, 400, `Action inconnue : ${action}`);
      const url = new URL(SHEETS_URL);
      url.searchParams.set('action', action);
      if (sheet) url.searchParams.set('sheet', sheet);
      url.searchParams.set('token', SHEETS_TOKEN);
      upstream = await fetch(url, { redirect: 'follow' });
    } else if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (!ACTIONS.has(body.action)) return fail(res, 400, `Action inconnue : ${body.action}`);
      // text/plain : format attendu par Apps Script (pas de preflight côté Google)
      upstream = await fetch(SHEETS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...body, token: SHEETS_TOKEN }),
      });
    } else {
      res.setHeader('Allow', 'GET, POST');
      return fail(res, 405, 'Méthode non autorisée.');
    }

    const text = await upstream.text();
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return fail(res, 502, `Réponse inattendue de Google Apps Script (HTTP ${upstream.status}).`);
    }
  } catch (e) {
    return fail(res, 502, `Google Sheets injoignable : ${e.message}`);
  }
}
