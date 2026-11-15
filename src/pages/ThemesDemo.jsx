import { useState } from 'react';
import { ArrowLeftRight, BarChart3, Briefcase, Check, Coffee, LayoutGrid, Plus, ShoppingBasket, Target } from 'lucide-react';
import { PICKER_THEMES, TOKENS, isOrigin } from '../theme/themes';
import { useAppTheme } from '../theme/useAppTheme';
import { Swatches, RatioBar } from '../components/ThemePicker';

const BARS = [38, 62, 45, 80, 52, 70, 95];
const ROWS = [
  { icon: ShoppingBasket, name: 'Alimentation', amount: '−420,00', type: 'expense' },
  { icon: Briefcase, name: 'Salaire', amount: '+12 000,00', type: 'income' },
  { icon: Coffee, name: 'Café', amount: '−28,00', type: 'expense' },
];
const NAV = [LayoutGrid, ArrowLeftRight, Target, BarChart3];

function Switch({ label }) {
  const [on, setOn] = useState(true);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? 'bg-accent' : 'bg-fg/25'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full shadow-soft transition-all duration-300 ease-out ${on ? 'left-6 bg-on-accent' : 'left-1 bg-surface'}`}
      />
    </button>
  );
}

const ratio = (v) => `${v.toFixed(1).replace('.', ',')}:1`;

/** Aperçu mobile d'un thème : chaque zone n'utilise que les tokens (via data-theme). */
function Preview({ theme, current, onPick }) {
  const tk = TOKENS[theme.id];
  const [nav, setNav] = useState(0);
  const checks = [
    ['60 % fond', tk.ratios.main, tk.adjusted.textOnMain],
    ['30 % cartes', tk.ratios.second, tk.adjusted.textOnSecond],
    ['10 % accent', tk.ratios.accent, tk.adjusted.textOnAccent],
  ];
  return (
    <article
      data-theme={theme.id}
      className={`surface-main flex w-[300px] shrink-0 snap-center flex-col gap-3 rounded-[2rem] p-4 shadow-lift md:w-auto ${
        current ? 'ring-[3px] ring-accent' : 'ring-1 ring-fg/15'
      }`}
    >
      <header className="flex items-start justify-between gap-3 px-1 pt-1">
        <div className="min-w-0">
          <p className="text-[12px] text-fg-muted">{theme.mode === 'dark' ? 'Sombre' : 'Clair'}</p>
          <h2 className="serif truncate text-[21px] leading-tight">{theme.label}</h2>
        </div>
        <Switch label={`Notifications (${theme.label})`} />
      </header>

      <section className="glass !rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="label">Solde</span>
          <span className="badge">Nouveau</span>
        </div>
        <p className="serif mt-2 text-[28px] leading-none">
          18 540<span className="ml-1 text-[13px] text-fg-muted">MAD</span>
        </p>
        <span className="mt-3 inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">+4,2 % vs mois dernier</span>
      </section>

      <section className="glass !rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="label">Dépenses · 7 jours</span>
          <a href="#/stats" className="text-[12px] font-medium text-accent underline-offset-2 hover:underline">
            Détails
          </a>
        </div>
        <div className="mt-3 flex h-20 items-end gap-1.5" aria-hidden="true">
          {BARS.map((h, i) => (
            <span key={i} className={`flex-1 rounded-md ${i === BARS.length - 1 ? 'bg-accent' : 'bg-fg/20'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </section>

      <section className="glass !rounded-2xl p-2">
        {ROWS.map(({ icon: Icon, name, amount, type }) => (
          <div key={name} className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl bg-fg/10">
              <Icon size={15} strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{name}</span>
            <span className={`num text-[13px] font-medium ${type === 'income' ? 'text-success' : 'text-fg'}`}>{amount}</span>
          </div>
        ))}
      </section>

      <label className="flex flex-col gap-1.5 px-1">
        <span className="label !text-fg-muted">Montant</span>
        <input className="input !py-2.5" placeholder="0,00 MAD" inputMode="decimal" />
      </label>

      <button type="button" onClick={onPick} className="btn-primary w-full !py-3">
        {current ? <Check size={16} /> : <Plus size={16} />} {current ? 'Thème actif' : 'Utiliser ce thème'}
      </button>

      <nav className="nav-bar surface-second flex items-center justify-around rounded-full border border-line px-2 py-1.5" aria-label="Navigation (aperçu)">
        {NAV.map((Icon, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setNav(i)}
            aria-current={nav === i ? 'page' : undefined}
            aria-label={`Onglet ${i + 1}`}
            className={`grid h-10 w-12 place-items-center rounded-full transition-colors duration-300 ${nav === i ? 'bg-accent text-on-accent' : 'text-fg-muted'}`}
          >
            <Icon size={18} strokeWidth={nav === i ? 2 : 1.6} />
          </button>
        ))}
      </nav>

      <footer className="flex flex-col gap-2 px-1 pb-1">
        <div className="flex items-center justify-between gap-3">
          <Swatches />
          <span className="num text-[11px] text-fg-muted">{[tk.main, tk.second, tk.accent].join(' · ')}</span>
        </div>
        <RatioBar />
        <ul className="grid grid-cols-3 gap-1 text-[10.5px] leading-tight text-fg-muted">
          {checks.map(([k, v, adj]) => (
            <li key={k}>
              {k}
              <br />
              <span className="num font-semibold text-fg">{ratio(v)}</span> {v >= 4.5 ? '✓ AA' : '✕'}
              {adj && <span className="block">texte ajusté</span>}
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
}

/** Écran de démonstration : le design d'origine et les 6 thèmes côte à côte. */
export default function ThemesDemo() {
  const { theme, setTheme } = useAppTheme();
  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl text-sm text-fg-muted">
        Le design d'origine et les 6 thèmes côte à côte, chacun rendu uniquement avec ses tokens. Touchez « Utiliser ce thème » pour l'appliquer à toute
        l'application, sans rechargement.
      </p>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
        {PICKER_THEMES.map((t) => (
          <Preview key={t.id} theme={t} current={isOrigin(t.id) ? isOrigin(theme.id) : theme.id === t.id} onPick={() => setTheme(t.id)} />
        ))}
      </div>
    </div>
  );
}
