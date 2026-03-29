/// <reference types='vitest' />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { reactRouter } from '@react-router/dev/vite';

const workspaceDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Config runs in Node; `import.meta.env` is not filled from `.env` like app code.
  // apps/web/.env uses COROS_API_ORIGIN; optional VITE_COROS_API_ORIGIN for Vite-style naming.
  const env = loadEnv(mode, workspaceDir, ['COROS_', 'VITE_']);
  const API_ORIGIN =
    env.VITE_COROS_API_ORIGIN ||
    env.COROS_API_ORIGIN ||
    'http://localhost:3000';

  return {
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/web',
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '~': path.join(workspaceDir, 'app'),
      },
    },
    server: {
      port: 4200,
      host: 'localhost',
      proxy: {
        // Forward /api/v1/* to Nest (global prefix is v1/api), so RR/Vite never treats API paths as app routes.
        '/api': {
          target: API_ORIGIN,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/v1/, '/v1/api'),
        },
      },
    },
    preview: {
      port: 4200,
      host: 'localhost',
    },
    plugins: [!process.env.VITEST && reactRouter()],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [],
    // },
    build: {
      outDir: './dist',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
});
