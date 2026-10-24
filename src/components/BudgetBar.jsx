import CategoryIcon from './ui/CategoryIcon';
import { money } from '../utils/format';
import Amount from './ui/Amount';

/** Couleur selon le taux de consommation : sauge < 75 %, ocre < 100 %, terracotta au-delà. */
export function budgetTone(ratio) {
  if (ratio >= 1) return { bar: 'from-[#DA8A6C] to-expense', text: 'text-expense', label: 'Dépassé' };
  if (ratio >= 0.75) return { bar: 'from-[#E9A94F] to-ochre', text: 'text-ochre', label: 'Attention' };
  return { bar: 'from-[#9AA77F] to-income', text: 'text-income', label: 'OK' };
}

export default function BudgetBar({ category, spent, amount, compact = false, onClick }) {
  const ratio = amount ? spent / amount : 0;
  const tone = budgetTone(ratio);
  const left = amount - spent;
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-2.5 text-left transition-all duration-300 ease-out hover:bg-sand/40 dark:hover:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3.5">
        <CategoryIcon icon={category?.icon} color={category?.color} size={compact ? 32 : 40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[14px] font-medium">{category?.name ?? '—'}</span>
            <span className="text-[13px]">
              <span className="serif text-[15px]"><Amount value={spent} /></span>
              <span className="num text-ink-400"> / <Amount value={amount} /></span>
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand/70 dark:bg-white/[0.06]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-[width] duration-700 ease-out`}
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
          {!compact && (
            <div className="mt-1.5 flex justify-between text-xs">
              <span className={tone.text}>{Math.round(ratio * 100)} % utilisé</span>
              <span className="text-ink-500 dark:text-ink-400">
                {left >= 0 ? `Reste ${money(left)}` : `Dépassement de ${money(-left)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
