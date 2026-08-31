# 브랜치 워크플로

## 브랜치 구조 (2026-08-31 3환경 — 이슈 #36, 400 Engineering 거버넌스 정합)

```
feature/*  →  develop  →  staging  →  main
```

| 브랜치 | 용도 | 배포 도메인 |
|--------|------|------|
| `feature/*` | 기능 개발 (로컬 작업 브랜치) | - |
| `develop` | 개발계 — 기능 통합 | `dev.admin.ohart.co.kr` |
| `staging` | 스테이징 — QA/검증 환경 | `stage.admin.ohart.co.kr` |
| `main` | 운영 배포 | `admin.ohart.co.kr` |

`400 Engineering/404_project_governance/260723_git-branch-strategy_governance.md`의 브랜치 전략(Git Flow + 환경 백포트)을 그대로 따른다.

DB는 develop/staging/main 모두 현재 동일한 Supabase 프로젝트를 공유(분리 안 함) — Supabase Branching으로 develop/staging을 분리할 계획이지만 비용 승인 보류 중. 마이그레이션 히스토리는 `ohartgroup/ohartkorea-database-supabase` 레포(main/develop/staging 동일 구조)에서 관리.

## 로컬 PR 정책

- **로컬에서 PR은 항상 `feature/*` → `develop`**
- `develop` → `staging`, `staging` → `main` 승격 PR은 릴리즈/배포 담당자가 별도로 생성한다.
- 에이전트가 PR/MR을 생성할 때 `develop`이 아닌 `staging`/`main`을 타겟으로 두지 않는다.

## 브랜치 네이밍

- 기능: `feature/<짧은-설명>` (예: `feature/i18n-json-migration`)
- 현재 브랜치가 `develop`, `staging`, `main` 중 하나면 push/PR 명령 실행 전 사용자에게 feature 브랜치 생성을 안내한다.

## diff base

- PR description, 코드 리뷰, 변경 분석의 base는 **`develop`**
- `staging`/`main` 하드코딩 금지 (승격 PR 작성 시에만 예외)
