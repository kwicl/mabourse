# mABOUrse

Gestion de finances personnelles (saisie manuelle, sans synchronisation bancaire), inspirée de Wallet by BudgetBakers.
Frontend React + Tailwind + Recharts. Base de données : Google Sheets via une Web App Google Apps Script.

## Démarrage

```bash
npm install
npm run dev
```

Sans configuration, l'app tourne en **mode local** : données de démonstration générées et persistées dans `localStorage`.

## Architecture

```
mABOUrse/
├─ google-apps-script/Code.gs     Backend : API CRUD sur les feuilles Google Sheets
├─ public/                        avatar-bw.png (portrait N&B), logo.png (favicon avec badge $)
└─ src/
   ├─ config.js                   URL/jeton Sheets + devise (env ou Réglages)
   ├─ services/sheetService.js    getAll / list / create / update / remove (GET/POST/PUT/DELETE)
   ├─ context/FinanceContext.jsx  État global, mises à jour optimistes + rollback
   ├─ data/mockData.js            Catégories, comptes, budgets et 6 mois d'opérations factices
   ├─ utils/                      format.js (Intl), stats.js (soldes, séries, agrégats)
   ├─ hooks/                      useTheme, useHashRoute, useChartTheme
   ├─ components/
   │  ├─ layout/                  Sidebar, MobileNav, Logo
   │  ├─ charts/                  BalanceChart, CategoryDonut, MonthlyBars, ChartTooltip
   │  ├─ transactions/            TransactionForm (modal), TransactionList
   │  ├─ ui/                      Card, Modal, Segmented, CategoryIcon
   │  └─ KpiCard, BudgetBar, MonthPicker
   └─ pages/                      Dashboard, Transactions, Budgets, Stats, Settings
```

## Structure du Google Sheet

`setup()` crée ces feuilles (ligne 1 = en-têtes) :

| Feuille | Colonnes |
|---|---|
| Transactions | id, date (YYYY-MM-DD), type (income/expense/transfer), amount (positif), categoryId, accountId, toAccountId, note, createdAt |
| Categories | id, name, type (income/expense), icon (nom Lucide), color (#hex) |
| Budgets | id, categoryId, amount (limite mensuelle) |
| Accounts | id, name, type, initialBalance, color |

## Connexion à Google Sheets

1. Créer un Google Sheet vide.
2. **Extensions › Apps Script** : coller `google-apps-script/Code.gs`.
3. Exécuter `setup` une fois et accepter les autorisations.
4. **Paramètres du projet › Propriétés du script** : ajouter `API_TOKEN` = un secret long.
5. **Déployer › Nouveau déploiement › Application Web** : exécuter en tant que *Moi*, accès *Tout le monde*.
6. Copier l'URL `/exec` dans `.env` (voir `.env.example`) ou dans **Réglages** de l'app.

Après chaque modification de `Code.gs`, créer une nouvelle version du déploiement.

### Sécurité

La Web App est publique : le jeton `API_TOKEN` est la seule protection. Il est embarqué dans le bundle si défini via `.env`.
Pour un usage personnel, préférez la saisie dans **Réglages** (stocké uniquement dans le navigateur) et ne publiez pas l'app avec le jeton.

### Détails API

- `GET ?action=all&token=…` toutes les feuilles ; `GET ?action=list&sheet=X&token=…` une feuille.
- `POST` (corps JSON en `text/plain` pour éviter le preflight CORS) : `create`, `update`, `delete`, `bulkCreate`.
- Écritures sérialisées par `LockService`.

## Déploiement Vercel (accès sécurisé)

En production, l'app passe par la fonction serverless `api/sheets.js` : le jeton reste sur le serveur
et l'app demande un mot de passe à l'ouverture. Dans Vercel › Settings › Environment Variables :

| Variable | Valeur |
|---|---|
| `SHEETS_URL` | URL `/exec` de la Web App |
| `SHEETS_TOKEN` | valeur de `API_TOKEN` (propriétés du script) |
| `APP_PASSWORD` | (facultatif) mot de passe pour ouvrir l'app ; sans lui, toute personne ayant l'URL accède aux données |

Ne pas définir `VITE_SHEETS_URL` / `VITE_SHEETS_TOKEN` sur Vercel : les variables `VITE_` sont copiées dans le JavaScript public.
Après modification des variables : Deployments › Redeploy.

Sur iPhone : Safari › Partager › « Sur l'écran d'accueil » pour installer l'icône mABOUrse.

## Build

```bash
npm run build
```

Sortie statique dans `dist/` (Netlify, Vercel, GitHub Pages…).
