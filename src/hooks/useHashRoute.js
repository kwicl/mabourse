import { useEffect, useState } from 'react';

const read = () => window.location.hash.replace(/^#\/?/, '') || 'dashboard';

/** Routeur minimal basé sur le hash (#/transactions, #/budgets…). */
export function useHashRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = (r) => {
  window.location.hash = `/${r}`;
};
