import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FinanceProvider } from './context/FinanceContext';
import './index.css';
// Surcouche optionnelle (inactive tant que <html> n'a pas la classe « theme-hologram »)
import './hologram/useHologram';
import './hologram/hologram.css';
import './hologram/water-button.js';
import './hologram/app-background.css';

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
