import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: [
      'app/**/*.{test,spec}.{js,ts}',
      'tests/**/*.{test,spec}.{js,ts}',
    ],
    // 초기 보일러플레이트: 테스트 파일이 없어도 게이트를 통과시키고,
    // 이후 신규/변경 코드부터 점진적으로 커버리지를 올린다 (G5 3.1).
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['app/**/*.{js,ts}'],
      exclude: [
        'app/**/*.{test,spec}.{js,ts}',
        'app/**/*.d.ts',
        'app/**/*.vue',
        '**/*.config.*',
        'coverage/**',
        '**/node_modules/**',
        '**/.nuxt/**',
      ],
    },
  },
})
