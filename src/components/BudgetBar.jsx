import CategoryIcon from './ui/CategoryIcon';
import { money } from '../utils/format';
import Amount from './ui/Amount';

/** Couleur d'état selon le taux de consommation : succès < 75 %, alerte < 100 %, erreur au-delà. */
export function budgetTone(ratio) {
  if (ratio >= 1) return { bar: 'bg-error', key: 'expense', text: 'text-error', label: 'Dépassé' };
  if (ratio >= 0.75) return { bar: 'bg-warning', key: 'warning', text: 'text-warning', label: 'Attention' };
  return { bar: 'bg-success', key: 'income', text: 'text-success', label: 'OK' };
}

export default function BudgetBar({ category, spent, amount, compact = false, onClick }) {
  const ratio = amount ? spent / amount : 0;
  const tone = budgetTone(ratio);
  const left = amount - spent;
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-2.5 text-left transition-all duration-300 ease-out hover:bg-fg/10"
    >
      <div className="flex items-center gap-3.5">
        <CategoryIcon icon={category?.icon} size={compact ? 32 : 40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[14px] font-medium">{category?.name ?? '—'}</span>
            <span className="text-[13px]">
              <span className="serif text-[15px]"><Amount value={spent} /></span>
              <span className="num text-fg-muted"> / <Amount value={amount} /></span>
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fg/10">
            <div
              className={`h-full rounded-full ${tone.bar} transition-[width] duration-700 ease-out`}
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
          {!compact && (
            <div className="mt-1.5 flex justify-between text-xs">
              <span className={tone.text}>{Math.round(ratio * 100)} % utilisé</span>
              <span className="text-fg-muted">
                {left >= 0 ? `Reste ${money(left)}` : `Dépassement de ${money(-left)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
