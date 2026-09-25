import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Конфиг Vite: алиас @ (API зовём напрямую — у GREEN-API CORS *) */
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/green-api-test/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src')
    }
  },
  server: {
    host: true,
    port: 3100
  }
}));
