// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://solvyxdigital.com',
  // Static by default; only routes with `export const prerender = false`
  // (src/pages/api/**) run as a Netlify Function.
  output: 'static',
  adapter: netlify(),
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap({ filter: (page) => !page.includes('/resultado') && !page.includes('/result') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
