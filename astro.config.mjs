// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Phase 1 — D-25: static output, Vercel adapter, React islands, Tailwind v4 via Vite plugin.
// Note: D-15 references `applyBaseStyles: false` which was an option of the deprecated
// @astrojs/tailwind integration. With @tailwindcss/vite (the v4 path) base styles are not
// loaded twice, so the intent of D-15 is satisfied without an explicit flag.
//
// Adapter note: @astrojs/vercel (v9+, unified) replaces the old `@astrojs/vercel/static`
// subpath import. With `output: 'static'` the adapter produces a static Vercel deploy
// without needing /static or /serverless subpaths.
export default defineConfig({
  output: 'static',
  site: 'https://ronaldcheng.dev', // Phase 11: canonical URL base (DEPLOY-003)
  adapter: vercel({}),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle heavy deps so Vite dev server doesn't hit 504 "Outdated Optimize Dep"
    // errors on first load of R3F/three.js islands. These are large packages that
    // benefit from explicit inclusion in Vite's dep optimizer.
    optimizeDeps: {
      // Pre-bundle R3F/three deps. We use direct sub-path imports for drei
      // (./web/View.js, ./core/Gltf.js) instead of the barrel to avoid the
      // 504 "Outdated Optimize Dep" caused by Vite timing out on bundling
      // drei's 139-export barrel.
      include: [
        'three',
        '@react-three/fiber',
        '@react-three/drei/web/View.js',
        '@react-three/drei/core/Gltf.js',
        'use-sync-external-store',
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      force: true,
    },
    server: {
      warmup: {
        clientFiles: [
          './src/components/canvas/SceneCanvas.tsx',
          './src/components/HeroTyping.tsx',
        ],
      },
    },
  },
});
