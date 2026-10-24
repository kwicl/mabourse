import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, monthKey, todayISO } from '../utils/format';
import { shiftMonth } from '../utils/stats';

export default function MonthPicker({ value, onChange }) {
  const isCurrent = value >= monthKey(todayISO());
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-sand-line bg-white/60 p-1 shadow-soft backdrop-blur-md dark:border-night-line dark:bg-white/[0.03] dark:shadow-none">
      <button onClick={() => onChange(shiftMonth(value, -1))} className="btn-ghost h-8 w-8 !p-0" aria-label="Mois précédent">
        <ChevronLeft size={16} />
      </button>
      <span className="serif min-w-[130px] text-center text-[17px] capitalize">{monthLabel(value, 'long')}</span>
      <button onClick={() => onChange(shiftMonth(value, 1))} disabled={isCurrent} className="btn-ghost h-8 w-8 !p-0" aria-label="Mois suivant">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
