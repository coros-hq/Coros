/// <reference types='vitest' />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { reactRouter } from '@react-router/dev/vite';

const workspaceDir = path.dirname(fileURLToPath(import.meta.url));

/** Proxy must target the API server origin only (Nest uses global prefix `v1/api`). */
function apiProxyTarget(raw: string | undefined): string {
  const fallback = 'http://localhost:3000';
  const s = raw?.trim();
  if (!s) return fallback;
  try {
    return new URL(s.startsWith('http') ? s : `http://${s}`).origin;
  } catch {
    return fallback;
  }
}

export default defineConfig(({ mode }) => {
  // Config runs in Node; `import.meta.env` is not filled from `.env` like app code.
  // `COROS_API_ORIGIN` may include `/v1/api`; the proxy only needs the origin.
  const env = loadEnv(mode, workspaceDir, ['COROS_', 'VITE_']);
  const API_ORIGIN = apiProxyTarget(env.COROS_API_ORIGIN);

  return {
    // Expose `COROS_*` so `COROS_API_ORIGIN` matches axios base URL (not only Vite proxy).
    envPrefix: ['VITE_', 'COROS_'],
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
        // Browser uses `/api/v1/*` (see api.ts); rewrite to Nest `v1/api/*`
        '/api': {
          target: API_ORIGIN,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/v1/, '/v1/api'),
          configure: (proxy) => {
            proxy.on('proxyReq', (_, req) => {
              console.log('[proxy]', req.method, req.url);
            });
          },
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
