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
  // @nuxtjs/seo(nuxt-site-config)의 기본 titleTemplate이 %siteName을 참조하는데
  // site.name을 설정 안 하면 치환이 안 되고 탭 제목에 "%siteName"이 그대로 노출된다.
  site: {
    name: '오아트 통합어드민',
  },
  colorMode: {
    preference: 'system',
    fallback: 'light',
  },
  runtimeConfig: {
    public: {
      applicationVersion: JSON.stringify(packageJson.version),
      // 절대 URL이 필요한 곳(서버 사이드 링크 생성 등)에서 쓸 환경별 기준 URL.
      // Vercel Environment Variables로 브랜치별 오버라이드 가능하지만, 도메인이 이미
      // 고정되어 있어서 기본값만으로도 바로 동작한다.
      localBaseUrl: process.env.LOCAL_BASE_URL || 'http://localhost:3041',
      devBaseUrl: process.env.DEV_BASE_URL || 'https://dev.admin.ohart.co.kr',
      stagingBaseUrl: process.env.STAGING_BASE_URL || 'https://stage.admin.ohart.co.kr',
      productionBaseUrl: process.env.PRODUCTION_BASE_URL || 'https://admin.ohart.co.kr',
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
  // Nuxt UI의 UDashboardSidebar가 데스크톱/모바일 드로어용으로 사이드바 콘텐츠(AppSidebar)를
  // SSR HTML에 두 벌 렌더링하는 구조라(라이브러리 내부 동작, 우리 코드가 아님), reka-ui가 생성하는
  // 아코디언/셀렉트 id가 두 사본 사이에서 겹쳐 아래 4개 규칙이 항상 오탐으로 걸린다.
  // dev 콘솔에서만 보이고 production(prerender 없음)엔 영향 없음 — 노이즈만 끈다.
  htmlValidator: {
    options: {
      rules: {
        'no-dup-id': 'off',
        'prefer-native-element': 'off',
        'no-missing-references': 'off',
        'unique-landmark': 'off',
      },
    },
  },
  supabase: {
    redirect: false,
  },
})
