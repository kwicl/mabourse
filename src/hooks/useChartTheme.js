import { useAppTheme } from '../theme/useAppTheme';
import { mix } from '../theme/themes';

/**
 * Couleurs des graphiques, dérivées des tokens du thème courant.
 * Les graphiques sont posés sur des cartes (couleur « second ») : variantes lisibles sur cette surface.
 */
export function useChartTheme() {
  const { theme: t } = useAppTheme();
  const s = t.onSecond;
  return {
    dark: t.dark,
    surface: t.second,
    ink: t.textOnSecond,
    axis: s.muted,
    grid: mix(t.second, t.textOnSecond, 0.14),
    cursor: mix(t.second, t.textOnSecond, 0.3),
    track: mix(t.second, t.textOnSecond, 0.12),
    accent: s.accentGfx,
    accentSoft: mix(s.accentGfx, t.second, 0.3),
    income: s.successGfx,
    incomeSoft: mix(s.successGfx, t.second, 0.35),
    expense: s.errorGfx,
    expenseSoft: mix(s.errorGfx, t.second, 0.35),
    warning: s.warningGfx,
    ramp: t.ramp,
    other: t.other,
  };
}
