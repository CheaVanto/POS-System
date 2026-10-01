import fs from 'fs';
import path from 'path';

export default defineNuxtConfig({
  compatibilityDate: '2025-02-01',
  devtools: { enabled: false },
  // Client-side SPA (matches the house style — no SSR).
  ssr: false,
  modules: ['@pinia/nuxt'],
  css: [
    // Every .css in assets/css is auto-registered (drop a file in, no import needed).
    ...fs
      .readdirSync(path.resolve(__dirname, 'assets/css'))
      .filter((file) => file.endsWith('.css'))
      .map((file) => `~/assets/css/${file}`),
  ],
  components: true,
  plugins: ['~/plugins/axios', '~/plugins/toast'],
  runtimeConfig: {
    public: {
      // Base URL of the POS API. Override with NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:4000/api',
    },
  },
  app: {
    head: {
      title: 'POS Backoffice',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
});
