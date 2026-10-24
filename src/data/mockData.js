// Données factices — mêmes ids que les valeurs par défaut de google-apps-script/Code.gs

export const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Alimentation', type: 'expense', icon: 'ShoppingBasket', color: '#f59e0b' },
  { id: 'restaurant', name: 'Restaurants', type: 'expense', icon: 'UtensilsCrossed', color: '#f97316' },
  { id: 'transport', name: 'Transport', type: 'expense', icon: 'Car', color: '#3b82f6' },
  { id: 'housing', name: 'Logement', type: 'expense', icon: 'Home', color: '#8b5cf6' },
  { id: 'bills', name: 'Factures', type: 'expense', icon: 'Zap', color: '#eab308' },
  { id: 'shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'health', name: 'Santé', type: 'expense', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'leisure', name: 'Loisirs', type: 'expense', icon: 'Gamepad2', color: '#06b6d4' },
  { id: 'travel', name: 'Voyages', type: 'expense', icon: 'Plane', color: '#14b8a6' },
  { id: 'education', name: 'Éducation', type: 'expense', icon: 'GraduationCap', color: '#6366f1' },
  { id: 'salary', name: 'Salaire', type: 'income', icon: 'Briefcase', color: '#10b981' },
  { id: 'freelance', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#22c55e' },
  { id: 'investment', name: 'Investissements', type: 'income', icon: 'TrendingUp', color: '#84cc16' },
  { id: 'gift', name: 'Cadeaux', type: 'income', icon: 'Gift', color: '#a855f7' },
];

export const DEFAULT_ACCOUNTS = [
  { id: 'main', name: 'Compte courant', type: 'bank', initialBalance: 18500, color: '#5b5bf6' },
  { id: 'cash', name: 'Espèces', type: 'cash', initialBalance: 1200, color: '#10b981' },
];

const DEFAULT_BUDGETS = [
  { id: 'b-food', categoryId: 'food', amount: 3000 },
  { id: 'b-restaurant', categoryId: 'restaurant', amount: 1200 },
  { id: 'b-transport', categoryId: 'transport', amount: 1000 },
  { id: 'b-shopping', categoryId: 'shopping', amount: 2000 },
  { id: 'b-leisure', categoryId: 'leisure', amount: 500 },
  { id: 'b-bills', categoryId: 'bills', amount: 900 },
];

// PRNG déterministe pour des données stables entre rechargements
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (d) => d.toISOString().slice(0, 10);

export function buildMockDatabase() {
  const rand = mulberry32(42);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (a, b) => Math.round((a + rand() * (b - a)) * 100) / 100;

  const tx = [];
  let n = 0;
  const add = (date, type, amount, categoryId, note, accountId = 'main', toAccountId = '') =>
    tx.push({
      id: `mock-${++n}`,
      date: iso(date),
      type,
      amount,
      categoryId,
      accountId,
      toAccountId,
      note,
      createdAt: date.toISOString(),
    });

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setMonth(start.getMonth() - 6);
  start.setDate(1);

  const notes = {
    food: ['Marjane', 'Carrefour Market', 'Marché central', 'Épicerie'],
    restaurant: ['Café', 'Déjeuner équipe', 'Dîner', 'Brunch'],
    transport: ['Carburant', 'Taxi', 'Tramway', 'Péage'],
    shopping: ['Vêtements', 'Électronique', 'Maison'],
    leisure: ['Cinéma', 'Concert', 'Salle de sport', 'Streaming'],
    health: ['Pharmacie', 'Consultation'],
  };

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const day = d.getDate();
    const date = new Date(d);

    if (day === 1) add(date, 'income', 14500, 'salary', 'Salaire mensuel');
    if (day === 3) add(date, 'expense', 4200, 'housing', 'Loyer');
    if (day === 8) add(date, 'expense', between(380, 620), 'bills', 'Électricité & eau');
    if (day === 12) add(date, 'expense', 249, 'bills', 'Internet & mobile');
    if (day === 15 && rand() > 0.35) add(date, 'income', between(1800, 4200), 'freelance', 'Mission freelance');
    if (day === 20 && rand() > 0.6) add(date, 'income', between(200, 900), 'investment', 'Dividendes');
    if (day === 5) add(date, 'transfer', 1000, '', 'Retrait DAB', 'main', 'cash');

    if (rand() > 0.55) add(date, 'expense', between(45, 320), 'food', pick(notes.food));
    if (rand() > 0.75) add(date, 'expense', between(30, 260), 'restaurant', pick(notes.restaurant), rand() > 0.5 ? 'cash' : 'main');
    if (rand() > 0.8) add(date, 'expense', between(20, 350), 'transport', pick(notes.transport));
    if (rand() > 0.92) add(date, 'expense', between(150, 900), 'shopping', pick(notes.shopping));
    if (rand() > 0.9) add(date, 'expense', between(40, 220), 'leisure', pick(notes.leisure));
    if (rand() > 0.96) add(date, 'expense', between(60, 450), 'health', pick(notes.health));
  }

  return {
    Transactions: tx,
    Categories: DEFAULT_CATEGORIES,
    Budgets: DEFAULT_BUDGETS,
    Accounts: DEFAULT_ACCOUNTS,
  };
}
