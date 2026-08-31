# 브랜치 워크플로

## 브랜치 구조 (2026-08-31 2환경으로 단순화 — 이슈 #36)

```
feature/*  →  develop  →  main
```

| 브랜치 | 용도 | 배포 도메인 |
|--------|------|------|
| `feature/*` | 기능 개발 (로컬 작업 브랜치) | - |
| `develop` | 개발계 — 기능 통합 | `dev.admin.ohart.co.kr` |
| `main` | 운영 배포 | `admin.ohart.co.kr` |

1인 운영 체제라 `staging` 단계는 걷어냄(이전에 만들었다가 삭제). 팀 합류 등으로 검증 단계가 필요해지면 400 Engineering 거버넌스 문서(`260723_git-branch-strategy_governance.md`)의 3단계 구조로 다시 확장한다.

DB는 develop/main 모두 현재 동일한 Supabase 프로젝트를 공유(분리 안 함) — Branching 비용 승인 보류 중. 마이그레이션 히스토리는 `ohartgroup/ohartkorea-database-supabase` 레포(main/develop 2브랜치 구조)에서 관리.

## 로컬 PR 정책

- **로컬에서 PR은 항상 `feature/*` → `develop`**
- `develop` → `main` PR은 릴리즈/배포 담당자가 별도로 생성한다.
- 에이전트가 PR/MR을 생성할 때 `develop`이 아닌 `main`을 타겟으로 두지 않는다.

## 브랜치 네이밍

- 기능: `feature/<짧은-설명>` (예: `feature/i18n-json-migration`)
- 현재 브랜치가 `develop` 또는 `main`이면 push/PR 명령 실행 전 사용자에게 feature 브랜치 생성을 안내한다.

## diff base

- PR description, 코드 리뷰, 변경 분석의 base는 **`develop`**
- `main` 하드코딩 금지 (develop → main PR 작성 시에만 예외)
