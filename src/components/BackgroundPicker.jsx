import { Check, Shuffle } from 'lucide-react';
import { BACKGROUNDS, BG_AUTO, useBackground } from '../theme/liquid-glass';

/** Choix de la photo d'arrière-plan du thème Liquid Glass (mémorisé sur cet appareil). */
export default function BackgroundPicker({ className = '' }) {
  const { choice, setBackground } = useBackground();
  const tile = (active) =>
    `relative aspect-[9/16] overflow-hidden rounded-xl transition-transform duration-200 ease-out hover:-translate-y-0.5 ${
      active ? 'ring-[3px] ring-accent' : 'ring-1 ring-fg/15'
    }`;
  const tick = (
    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-on-accent">
      <Check size={12} strokeWidth={3} />
    </span>
  );
  return (
    <div className={className}>
      <span className="label mb-2 block">Arrière-plan</span>
      <div role="radiogroup" aria-label="Arrière-plan" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        <button
          type="button"
          role="radio"
          aria-checked={choice === BG_AUTO}
          onClick={() => setBackground(BG_AUTO)}
          className={`${tile(choice === BG_AUTO)} flex flex-col items-center justify-center gap-1.5 bg-fg/10 text-[11px] font-medium text-fg`}
        >
          <Shuffle size={18} />
          Au hasard
          {choice === BG_AUTO && tick}
        </button>
        {BACKGROUNDS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={choice === b.id}
            aria-label={b.label}
            title={b.label}
            onClick={() => setBackground(b.id)}
            className={tile(choice === b.id)}
          >
            <img src={b.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            {choice === b.id && tick}
          </button>
        ))}
      </div>
    </div>
  );
}
