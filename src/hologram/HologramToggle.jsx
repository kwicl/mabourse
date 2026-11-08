import { Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import { useHologram } from './useHologram';

/** Carte des réglages : design d'origine <-> mode hologramme. */
export default function HologramToggle() {
  const { on, toggle } = useHologram();
  return (
    <Card title="Apparence" subtitle="Mode hologramme : verre translucide, halos et reflets. Désactivé = design d'origine.">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className="holo-switch btn-ghost min-h-[44px] w-full justify-between !rounded-xl !px-3"
      >
        <span className="flex items-center gap-2">
          <Sparkles size={16} />
          Mode hologramme
        </span>
        <span className="holo-switch__track" data-on={on}>
          <span className="holo-switch__thumb" />
        </span>
      </button>
    </Card>
  );
}
