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
  // '/'는 로그인 필요한 대시보드 홈이라 prerender하면 안 됨 — 빌드 시점(세션 없음)에
  // 미들웨어가 결정한 /login 리디렉션이 정적으로 굳어버려서, 실제 로그인 상태와 무관하게
  // 항상 캐시된 리디렉션을 반환해 /login ↔ / 무한루프가 발생했다(2026-09-01 production 장애).
  routeRules: {},
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
