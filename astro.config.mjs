import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://n0rdp0l.github.io',
  integrations: [sitemap()],
  // Images are served as-is from public/, so no sharp is needed.
  image: { service: passthroughImageService() },
});
