import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Static output works well with Cloudflare Pages' direct-upload workflow.
// Production canonical URLs and the generated sitemap use agrocalculator.pp.ua.
export default defineConfig({
  site: 'https://agrocalculator.pp.ua',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
