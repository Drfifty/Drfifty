import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// ABD UNI PROJECT — Vite config (HMR + Prod Bundling)
// Reverb port 8080 is separate (php artisan reverb:start --port=8080)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4 — CSS-first, no tailwind.config.js required
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/js'),
    },
  },
  server: {
    host: '0.0.0.0', // required for preview proxy
    port: 5173,
    hmr: {
      host: 'localhost',
    },
  },
  build: {
    outDir: 'public/build',
    manifest: true,
  },
});
