import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Stamp public/sw.js (copied verbatim to dist) with a unique version per build
// so a new deploy invalidates every cache namespace without a manual bump.
function stampServiceWorker() {
  return {
    name: 'stamp-sw-version',
    apply: 'build',
    closeBundle() {
      const swPath = 'dist/sw.js';
      if (!existsSync(swPath)) return;
      const version = Date.now().toString(36);
      const assets = readdirSync('dist/assets').map((f) => `/assets/${f}`);
      const src = readFileSync(swPath, 'utf8')
        .replaceAll('__SW_VERSION__', version)
        .replace('/* __SW_ASSETS__ */ []', JSON.stringify(assets));
      writeFileSync(swPath, src);
    },
  };
}

export default defineConfig({
  plugins: [react(), stampServiceWorker()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
