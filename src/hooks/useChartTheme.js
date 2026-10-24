import { useEffect, useState } from 'react';

/** Couleurs des axes/grilles des graphiques selon le thème courant (palette chaude). */
export function useChartTheme() {
  const get = () => document.documentElement.classList.contains('dark');
  const [dark, setDark] = useState(get);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(get()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return {
    dark,
    axis: dark ? '#8F8A84' : '#8F8A84',
    grid: dark ? 'rgba(251,249,245,0.05)' : 'rgba(25,25,25,0.05)',
    cursor: dark ? 'rgba(251,249,245,0.18)' : 'rgba(25,25,25,0.14)',
    surface: dark ? '#221F1B' : '#FBF9F5',
    accent: '#CC5A37',
    accentSoft: '#DA7756',
    income: '#6F7F55',
    incomeSoft: '#9AA77F',
    expense: '#C2603F',
    expenseSoft: '#DA8A6C',
  };
}
