// https://nuxt.com/docs/api/configuration/nuxt-config
import packageJson from './package.json'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/a11y',
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@i2d/nuxt-pdf-frame',
    '@nuxthub/core',
    '@nuxtjs/device',
    '@nuxtjs/emotion',
    '@nuxtjs/google-fonts',
    '@nuxtjs/html-validator',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    '@nuxtjs/stylelint-module',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vercel/analytics',
    '@vercel/speed-insights',
    '@vueuse/nuxt',
    'dayjs-nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],
  devtools: {
    enabled: true,
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'system',
    fallback: 'light',
  },
  runtimeConfig: {
    public: {
      applicationVersion: JSON.stringify(packageJson.version),
    },
  },
  routeRules: {
    '/': { prerender: true },
  },
  compatibilityDate: '2026-06-30',
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },
  supabase: {
    redirect: false,
  },
})
