import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { money, pct } from '../utils/format';

/**
 * Carte KPI. `trend` = variation relative vs mois précédent ; `goodWhenUp` inverse la couleur (dépenses).
 */
export default function KpiCard({ label, value, icon: Icon, tint, trend, goodWhenUp = true, delay = 0, hint, className = '' }) {
  const hasTrend = Number.isFinite(trend);
  const good = hasTrend && (trend >= 0) === goodWhenUp;
  return (
    <div className={`glass glass-hover animate-fade-up min-w-0 p-4 sm:p-6 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-2">
        <span className="label truncate">{label}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `${tint}14`, color: tint }}>
          <Icon size={15} strokeWidth={1.8} />
        </span>
      </div>
      <div className="serif mt-4 truncate text-[18px] leading-none sm:text-[30px] xl:text-[23px] 2xl:text-[30px]">{money(value)}</div>
      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
        {hasTrend ? (
          <>
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
                good ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
              }`}
            >
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {pct(trend)}
            </span>
            <span className="text-ink-500 dark:text-ink-400">vs mois dernier</span>
          </>
        ) : (
          <span className="text-ink-500 dark:text-ink-400">{hint}</span>
        )}
      </div>
    </div>
  );
}
