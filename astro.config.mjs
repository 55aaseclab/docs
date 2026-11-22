import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://docs.55aaseclab.com',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
