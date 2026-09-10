import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { fileURLToPath } from 'url';
import path from 'path';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // Load-bearing: the router plugin resolves src/routes and src/routeTree.gen.ts
  // relative to this, so generation works no matter what directory vite is run from.
  root: projectRoot,
  plugins: [
    // Must be listed before react(). Generates src/routeTree.gen.ts from src/routes/.
    tanstackRouter({ target: 'react' }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': path.join(projectRoot, 'src') },
  },
  server: {
    // The preview environment merges its own server config on top of this one and
    // deep-merges nested objects, so this survives into the running dev server —
    // a runtime error shows in this app's own UI/console, not as a full-screen
    // overlay blocking the preview.
    hmr: { overlay: false },
  },
});
