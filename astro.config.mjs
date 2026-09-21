import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://n0rdp0l.github.io',
  integrations: [sitemap()],
  // Images are served as-is from public/, so no sharp is needed.
  image: { service: passthroughImageService() },
  markdown: {
    // Code blocks sit on the page's own ground, so they need a light and a
    // dark palette; global.css switches to the dark one under data-theme="crt".
    shikiConfig: {
      themes: { light: 'github-light', dark: 'nord' },
      defaultColor: 'light',
    },
  },
});
