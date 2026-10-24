import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import CategoryIcon from '../ui/CategoryIcon';
import { money } from '../../utils/format';
import { useChartTheme } from '../../hooks/useChartTheme';

const renderActive = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={8} />
  );
};

/** Anneau des catégories + légende interactive. */
export default function CategoryDonut({ data, limit = 5, height = 210, showLegend = true }) {
  const t = useChartTheme();
  const [active, setActive] = useState(null);

  const top = data.slice(0, limit);
  const rest = data.slice(limit).reduce((s, d) => s + d.value, 0);
  const total = data.reduce((s, d) => s + d.value, 0);
  const slices = rest > 0 ? [...top, { id: 'other', name: 'Autres', value: rest, color: t.dark ? '#4A4744' : '#E6E0D4', icon: 'Circle', share: rest / total }] : top;
  const focus = active != null ? slices[active] : null;

  if (!total) return <p className="py-16 text-center text-sm text-ink-400">Aucune dépense ce mois-ci.</p>;

  return (
    <div className={showLegend ? 'grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : ''}>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="92%"
              paddingAngle={2.5}
              cornerRadius={8}
              stroke="none"
              activeIndex={active ?? undefined}
              activeShape={renderActive}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
              animationDuration={800}
            >
              {slices.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="label">{focus ? focus.name : 'Total'}</span>
          <span className="serif mt-1 max-w-[62%] text-lg leading-tight sm:text-xl">{money(focus ? focus.value : total)}</span>
          {focus && <span className="text-xs text-ink-500">{Math.round(focus.share * 100)} %</span>}
        </div>
      </div>

      {showLegend && (
        <ul className="flex flex-col gap-1">
          {slices.map((s, i) => (
            <li
              key={s.id}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={`flex items-center gap-3 rounded-xl px-2 py-1.5 transition-all duration-300 ease-out ${active === i ? 'bg-sand/50 dark:bg-white/[0.04]' : ''}`}
            >
              <CategoryIcon icon={s.icon} color={s.color} size={32} />
              <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
              <span className="num text-sm font-medium">{money(s.value)}</span>
              <span className="w-10 text-right text-xs text-ink-400">{Math.round(s.share * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
