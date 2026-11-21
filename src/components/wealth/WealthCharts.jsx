import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from '../charts/ChartTooltip';
import { niceTicks } from '../charts/BalanceChart';
import { useChartTheme } from '../../hooks/useChartTheme';
import { compact, dayLabel } from '../../utils/format';

/** Couleur de chaque classe d'actifs : tokens du thème (l'or suit la couleur « avertissement », dorée). */
export function classColors(t) {
  return { property: t.ramp[0], stock: t.ramp[1], gold: t.warning, liquidity: t.other };
}

export const CLASS_LABELS = { property: 'Immobilier', stock: 'Bourse', gold: 'Or', liquidity: 'Liquidités' };

/** Évolution de la valeur des actifs, empilée par classe. */
export function WealthChart({ data, hidden = false, height = 240 }) {
  const t = useChartTheme();
  const c = classColors(t);
  const totals = data.map((d) => d.total);
  // Axe resserré autour des valeurs : une variation de quelques % reste visible
  const y = niceTicks(Math.max(0, Math.min(...totals) * 0.9), Math.max(1, ...totals));
  const axis = { tick: { fill: t.axis, fontSize: 11 }, axisLine: false, tickLine: false };
  const keys = ['property', 'stock', 'gold'].filter((k) => data.some((d) => d[k]));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k} id={`wealth-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c[k]} stopOpacity={0.55} />
              <stop offset="100%" stopColor={c[k]} stopOpacity={0.08} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="2 6" />
        <XAxis dataKey="date" tickFormatter={dayLabel} minTickGap={32} dy={8} {...axis} />
        <YAxis hide={hidden} domain={y.domain} ticks={y.ticks} tickFormatter={compact} width={44} {...axis} />
        <Tooltip
          content={<ChartTooltip labelFormatter={dayLabel} colors={c} masked={hidden ? keys : []} />}
          cursor={{ stroke: t.cursor, strokeDasharray: '4 4' }}
        />
        {keys.map((k) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            name={CLASS_LABELS[k]}
            stackId="w"
            stroke={c[k]}
            strokeWidth={2}
            fill={`url(#wealth-${k})`}
            animationDuration={700}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Mini-courbe (SVG pur) : tendance d'un actif. */
export function Sparkline({ points, width = 96, height = 30, className = '' }) {
  if (!points || points.length < 2) return null;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const xy = points.map((p, i) => [i * step, height - 3 - ((p.value - min) / span) * (height - 6)]);
  const d = xy.map(([x, yy], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${yy.toFixed(1)}`).join(' ');
  const up = vals[vals.length - 1] >= vals[0];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`${up ? 'text-success' : 'text-error'} ${className}`} aria-hidden="true">
      <path d={`${d} L${width},${height} L0,${height} Z`} fill="currentColor" opacity="0.12" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Barre d'allocation empilée + légende. `parts` = [{ key, value }]. */
export function AllocationBar({ parts, hidden = false }) {
  const t = useChartTheme();
  const c = classColors(t);
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  const shown = parts.filter((p) => p.value > 0);
  return (
    <div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-fg/10">
        {shown.map((p) => (
          <span key={p.key} className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full" style={{ width: `${(p.value / total) * 100}%`, background: c[p.key] }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {shown.map((p) => (
          <span key={p.key} className="flex items-center gap-2 text-[12px] text-fg-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: c[p.key] }} />
            {CLASS_LABELS[p.key]}
            <span className="font-semibold text-fg">{hidden ? '••' : `${Math.round((p.value / total) * 100)} %`}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
