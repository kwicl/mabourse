import { Check } from 'lucide-react';
import Card from '../components/ui/Card';
import { THEMES, themeVars } from './palette';
import { useHologram } from './useHologram';

const swatch = (v, k) => `hsl(${v[`--holo-${k}`]})`;

const ORIGIN = {
  id: 'origin',
  label: "Design d'origine",
  desc: 'Parthénon, terre cuite',
  bg: 'rgb(var(--mb-night))',
  dots: ['rgb(var(--mb-accent))', 'rgb(var(--mb-accent-soft))', 'rgb(var(--mb-ink))'],
  text: 'rgb(var(--mb-ink))',
};

const options = (dark) => [
  ORIGIN,
  ...THEMES.map((t) => [t, themeVars(t, dark)]).map(([t, v]) => ({
    id: t.id,
    label: t.label,
    desc: t.desc,
    bg: `linear-gradient(135deg, ${swatch(v, 'bg')}, ${swatch(v, 'bg-2')})`,
    dots: ['cyan', 'blue', 'violet', 'accent'].map((k) => swatch(v, k)),
    text: swatch(v, 'text'),
    muted: swatch(v, 'muted'),
  })),
];

/** Carte des réglages : choix de l'apparence (design d'origine ou un thème de la surcouche). */
export default function HologramToggle() {
  const { appearance, setAppearance, dark } = useHologram();
  return (
    <Card title="Apparence" subtitle="Design d'origine, ou un thème en verre translucide. Chaque thème a sa version jour et sa version nuit.">
      <div role="radiogroup" aria-label="Thème" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {options(dark).map((o) => {
          const active = appearance === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAppearance(o.id)}
              className={`theme-tile relative flex min-h-[88px] flex-col items-start gap-1 rounded-xl p-3 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 ${
                active ? 'ring-2 ring-accent' : 'ring-1 ring-black/10 dark:ring-white/10'
              }`}
              style={{ background: o.bg }}
            >
              <span className="flex gap-1">
                {o.dots.map((d, i) => (
                  <span key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: d }} />
                ))}
              </span>
              <span className="mt-auto text-[13px] font-semibold" style={{ color: o.text }}>
                {o.label}
              </span>
              <span className="text-[11px] leading-tight" style={{ color: o.muted || o.text, opacity: o.muted ? 1 : 0.7 }}>
                {o.desc}
              </span>
              {active && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
