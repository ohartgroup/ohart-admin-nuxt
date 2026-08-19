# Nuxt 4 Boilerplate

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

**바로 서비스 개발을 시작할 수 있는 Nuxt 4 보일러플레이트입니다.**

공식 스타터를 그대로 쓰는 수준이 아니라, 실제 웹 서비스에 자주 쓰는 모듈·컨벤션·CI/이슈 템플릿까지 미리 잡아 둔 출발점입니다.  
복사해서 새 프로젝트로 쓰거나, 이 레포를 템플릿으로 활용하세요.

## 이런 팀에 맞습니다

- Nuxt 4 + Nuxt UI로 빠르게 화면을 쌓고 싶을 때
- Supabase / Pinia / i18n / SEO를 처음부터 넣고 싶을 때
- Bun 기반 스크립트와 GitHub 이슈·커밋 컨벤션을 통일하고 싶을 때

## 포함되어 있는 것

| 영역 | 내용 |
|------|------|
| 프레임워크 | Nuxt 4, TypeScript, Tailwind CSS 4 |
| UI | Nuxt UI, Lucide / Simple Icons |
| 상태 | Pinia, pinia-plugin-persistedstate |
| 백엔드/연동 | Supabase, NuxtHub |
| 품질 | ESLint, Stylelint, Playwright / Vitest |
| 제품 기반 | i18n, SEO, Image, Scripts, A11y, Device |
| 운영 | Vercel Analytics / Speed Insights, Renovate |
| 협업 | GitHub Issue 템플릿, CI, Claude/Cursor 규칙·커맨드 |

## 문서

| 문서 | 설명 |
|------|------|
| [SETUP.md](./SETUP.md) | Bun 설치부터 `bun install` / `bun run dev`까지 실행 가이드 |
| [Nuxt UI Docs](https://ui.nuxt.com/docs/getting-started/installation/nuxt) | Nuxt UI 공식 문서 |
| [Nuxt Deployment](https://nuxt.com/docs/getting-started/deployment) | 배포 가이드 |

실행·환경 변수·명령어는 전부 **[SETUP.md](./SETUP.md)** 를 보세요. (패키지 매니저는 **Bun** 기준입니다.)

## 브랜치 / 커밋

- 워크플로: `feature/*` → `develop` → `main`
- 커밋 프리픽스: `feat` / `fix` / `modify` / `refactor` 등 → [`.claude/rules/commit-convention.md`](./.claude/rules/commit-convention.md)

## 라이선스 / 활용

이 보일러플레이트를 복제해 신규 서비스를 시작해도 됩니다.  
프로젝트명·환경 변수·Supabase 프로젝트만 새 서비스에 맞게 교체하면 됩니다.
