import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://n0rdp0l.github.io',
  integrations: [sitemap()],
});
