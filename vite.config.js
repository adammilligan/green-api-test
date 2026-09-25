import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
var rootDir = path.dirname(fileURLToPath(import.meta.url));
var DEFAULT_GREEN_API_URL = 'https://api.green-api.com';
/** Конфиг Vite: алиас @ и proxy для GREEN-API */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src')
    }
  },
  server: {
    host: true,
    port: 3100,
    proxy: {
      '/green-api': {
        target: DEFAULT_GREEN_API_URL,
        changeOrigin: true,
        timeout: 0,
        proxyTimeout: 0,
        rewrite: function (requestPath) {
          return requestPath.replace(/^\/green-api/, '');
        },
        /**
         * Динамический host из заголовка X-Green-Api-Url
         * (у инстансов GREEN-API apiUrl вида https://1103.api.green-api.com)
         */
        router: function (req) {
          var header = req.headers['x-green-api-url'];
          if (typeof header === 'string' && header.startsWith('https://')) {
            return header.replace(/\/$/, '');
          }
          return DEFAULT_GREEN_API_URL;
        }
      }
    }
  }
});
