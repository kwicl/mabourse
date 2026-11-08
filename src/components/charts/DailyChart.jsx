import { CartesianGrid, ComposedChart, Customized, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { niceTicks, seriesColors } from './BalanceChart';
import { useChartTheme } from '../../hooks/useChartTheme';
import { compact, dayLabel } from '../../utils/format';

/**
 * Dépenses de chaque jour (sans cumul) en courbe lissée dont l'épaisseur suit la dépense du jour.
 * Montant arrondi (sans virgule) écrit au-dessus de chaque point.
 * `data` : [{ date, expense }].
 */
const MIN_W = 2;
const MAX_W = 14;
const STEPS = 10; // échantillons par segment pour lisser le ruban

const widthFor = (v, max) => (max > 0 ? MIN_W + (Math.max(0, v) / max) * (MAX_W - MIN_W) : MIN_W);
const amount = (v) => Math.round(v).toLocaleString('fr-FR');

/** Ruban à épaisseur variable le long d'une spline de Catmull-Rom passant par les points. */
function Ribbon({ formattedGraphicalItems, offset, color, max }) {
  const pts = formattedGraphicalItems?.[0]?.props?.points?.filter((p) => p.y != null) ?? [];
  if (pts.length < 2) return null;
  const bottom = offset.top + offset.height;
  const widths = pts.map((p) => widthFor(p.value, max));
  const upper = [];
  const lower = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s <= STEPS; s++) {
      if (i > 0 && s === 0) continue;
      const t = s / STEPS;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const yRaw = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      const y = Math.min(bottom, yRaw); // pas de dépense négative sous l'axe
      // Tangente (dérivée de la spline) -> normale
      const dx = 0.5 * ((-p0.x + p2.x) + 2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t + 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);
      const dy = 0.5 * ((-p0.y + p2.y) + 2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t + 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2);
      const len = Math.hypot(dx, dy) || 1;
      const half = (widths[i] + (widths[i + 1] - widths[i]) * t) / 2;
      const nx = (-dy / len) * half;
      const ny = (dx / len) * half;
      upper.push(`${(x + nx).toFixed(2)},${(y + ny).toFixed(2)}`);
      lower.push(`${(x - nx).toFixed(2)},${(y - ny).toFixed(2)}`);
    }
  }
  const d = `M${upper.join('L')}L${lower.reverse().join('L')}Z`;
  return <path d={d} fill={color} fillOpacity={0.9} stroke={color} strokeWidth={0.6} strokeLinejoin="round" />;
}

export default function DailyChart({ data, height = 280 }) {
  const t = useChartTheme();
  const { expense: color, balance: ink } = seriesColors(t);
  const max = Math.max(0, ...data.map((d) => d.expense ?? 0));
  // Marge haute : place pour la demi-épaisseur et l'étiquette du point le plus haut
  const { domain, ticks } = niceTicks(0, max * 1.15, true);
  // Plus de 2 semaines : on n'écrit que les sommets de la courbe (et rien sous 10 % du max) pour rester lisible
  const many = data.length > 14;
  const isPeak = (i) => {
    const v = data[i]?.expense ?? 0;
    return v >= (data[i - 1]?.expense ?? 0) && v >= (data[i + 1]?.expense ?? 0) && v >= max * 0.1;
  };

  const label = ({ x, y, value, index }) => {
    if (!value || x == null || y == null) return null;
    if (many && !isPeak(index)) return null;
    return (
      <text
        x={x}
        y={y - widthFor(value, max) / 2 - 5}
        textAnchor="middle"
        fontSize={10}
        fill={ink}
        // Halo couleur de fond : reste lisible quand l'étiquette croise la courbe
        stroke={t.surface}
        strokeWidth={3}
        paintOrder="stroke"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {amount(value)}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 18, right: 14, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={t.grid} strokeDasharray="2 6" />
        <XAxis dataKey="date" tickFormatter={dayLabel} minTickGap={32} dy={8} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={domain} ticks={ticks} tickFormatter={compact} width={44} tick={{ fill: t.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip labelFormatter={dayLabel} />} cursor={{ stroke: t.cursor, strokeDasharray: '4 4' }} />
        <Customized component={(props) => <Ribbon {...props} color={color} max={max} />} />
        {/* Ligne invisible : fournit les points, le survol et les étiquettes */}
        <Line
          type="monotone"
          dataKey="expense"
          name="Dépenses"
          stroke={color}
          strokeOpacity={0}
          dot={false}
          activeDot={{ r: 4.5, strokeWidth: 3, stroke: t.surface, fill: color }}
          label={label}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
