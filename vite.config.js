import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    // Bundle unique : un découpage manuel (recharts / react) cassait l'ordre de chargement de React en production.
    // recharts (+ d3) dépasse 500 kB minifié.
    chunkSizeWarningLimit: 900,
  },
});
