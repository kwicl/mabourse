import { Check, LayoutGrid } from 'lucide-react';
import Card from './ui/Card';
import { ORIGIN, PICKER_THEMES, isOrigin } from '../theme/themes';
import OriginModeToggle from './OriginModeToggle';
import { useAppTheme } from '../theme/useAppTheme';
import { navigate } from '../hooks/useHashRoute';

/** Trois pastilles 60 / 30 / 10, dessinées avec les tokens du thème englobant (data-theme). */
export function Swatches({ size = 'md' }) {
  const big = size === 'lg';
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span className={`${big ? 'h-7 w-7' : 'h-5 w-5'} rounded-full bg-main ring-1 ring-fg/25`} />
      <span className={`${big ? 'h-6 w-6' : 'h-4 w-4'} rounded-full bg-second ring-1 ring-fg/25`} />
      <span className={`${big ? 'h-4 w-4' : 'h-3 w-3'} rounded-full bg-accent ring-1 ring-fg/25`} />
    </span>
  );
}

/** Barre proportionnelle 60 / 30 / 10. */
export function RatioBar() {
  return (
    <span className="flex h-1.5 w-full overflow-hidden rounded-full ring-1 ring-fg/20" aria-hidden="true">
      <span className="w-[60%] bg-main" />
      <span className="w-[30%] bg-second" />
      <span className="w-[10%] bg-accent" />
    </span>
  );
}

/** Carte des réglages : choix du thème, appliqué instantanément et mémorisé. */
export default function ThemePicker() {
  const { theme, setTheme, origin } = useAppTheme();
  return (
    <Card
      title="Thème"
      subtitle="Design d'origine (jour / nuit) ou un des 6 thèmes 60 / 30 / 10. Le choix est mémorisé sur cet appareil."
      action={
        <button onClick={() => navigate('themes')} className="btn-ghost shrink-0 !px-3 text-xs">
          <LayoutGrid size={14} /> Comparer
        </button>
      }
    >
      <div role="radiogroup" aria-label="Thème" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {PICKER_THEMES.map((t) => {
          const active = t.id === ORIGIN ? origin : theme.id === t.id;
          // Aperçu du design d'origine dans sa variante courante (jour ou nuit)
          const id = t.id === ORIGIN && isOrigin(theme.id) ? theme.id : t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              data-theme={id}
              onClick={() => setTheme(t.id)}
              className={`surface-main relative flex min-h-[104px] flex-col items-start gap-2 rounded-xl p-3 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 ${
                active ? 'ring-[3px] ring-accent' : 'ring-1 ring-fg/15'
              }`}
            >
              <Swatches />
              <span className="mt-auto text-[13px] font-semibold leading-tight text-fg">{t.label}</span>
              <span className="text-[11px] leading-tight text-fg-muted">{t.desc || (t.mode === 'dark' ? 'Sombre' : 'Clair')}</span>
              <RatioBar />
              {active && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-on-accent">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <OriginModeToggle variant="row" className="mt-3 !justify-between" />
    </Card>
  );
}
