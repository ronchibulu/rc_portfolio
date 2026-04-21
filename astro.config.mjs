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
  adapter: vercel({}),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
