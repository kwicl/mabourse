import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FinanceProvider } from './context/FinanceContext';
import './index.css';
// Thème 60/30/10 : appliqué dès l'import, avant le premier rendu
import './theme/useAppTheme';
import './theme/origin.css';
import './components/fx/water-button.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </React.StrictMode>,
);

// Fonctionnement hors-ligne : met l'app en cache pour qu'elle s'ouvre sans connexion
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
