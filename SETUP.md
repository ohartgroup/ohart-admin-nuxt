# Setup Guide

이 프로젝트는 **Bun**을 패키지 매니저로 사용합니다. (`pnpm` / `npm` 대신 `bun`을 사용하세요.)

## 1. Bun 설치

### macOS / Linux

```bash
curl -fsSL https://bun.sh/install | bash
```

설치 후 터미널을 다시 열거나, 안내된 대로 shell 설정을 적용합니다.

```bash
# 설치 확인
bun --version
```

### 업데이트

```bash
bun upgrade
```

### 기타 설치 방법

- **Homebrew (macOS)**: `brew install oven-sh/bun/bun`
- **공식 문서**: [https://bun.sh/docs/installation](https://bun.sh/docs/installation)

> Node.js는 Nuxt / 일부 도구 호환을 위해 **20+** 권장입니다. Bun만으로도 대부분 실행 가능합니다.

## 2. 의존성 설치

프로젝트 루트에서:

```bash
bun install
```

`postinstall`로 `nuxt prepare`가 자동 실행됩니다.

의존성을 처음부터 다시 깔 때:

```bash
bun run delete:modules
bun install
```

## 3. 환경 변수

루트에 `.env` 파일을 만듭니다. (`.env.example`이 있으면 복사해서 사용)

```bash
cp .env.example .env
```

Supabase를 쓸 경우 최소 값이 필요합니다.

```bash
NUXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=your-anon-or-publishable-key
```

> `.env`는 Git에 커밋하지 마세요. (`.gitignore`에 포함되어 있습니다.)

## 4. 개발 서버 실행

```bash
bun run dev
```

기본 주소: [http://localhost:3040](http://localhost:3040)

`package.json`의 `dev` 스크립트가 `nuxt dev --port 3040`을 실행합니다.

## 5. 자주 쓰는 Bun + Nuxt 명령어

`package.json` scripts는 모두 `bun run <script>`로 실행합니다.

| 목적 | 명령어 |
|------|--------|
| 의존성 설치 | `bun install` |
| 개발 서버 | `bun run dev` |
| 프로덕션 빌드 | `bun run build` |
| 빌드 미리보기 | `bun run preview` |
| 타입 체크 | `bun run typecheck` |
| ESLint | `bun run lint` |
| Stylelint | `bun run stylelint` |
| 테스트 | `bun run test` |
| 테스트 + 커버리지 | `bun run test -- --coverage` |
| Nuxt 캐시 정리 | `bun run cleanup` |
| 번들 분석 | `bun run analyze` |
| Nuxt 강제 업그레이드 | `bun run upgrade:force` |

### Bun으로 일회성 바이너리 실행 (npx 대체)

```bash
# npx 대신
bunx nuxi typecheck
bunx nuxi prepare
bunx nuxt analyze
```

### 패키지 추가 / 제거

```bash
# 런타임 의존성
bun add <package>

# 개발 의존성
bun add -d <package>

# 제거
bun remove <package>
```

## 6. 프로덕션

```bash
# 빌드
bun run build

# 로컬 프리뷰 (포트 3040)
bun run preview
```

배포는 Nuxt 배포 가이드를 참고하세요.  
[https://nuxt.com/docs/getting-started/deployment](https://nuxt.com/docs/getting-started/deployment)

## 7. 버전 / Supabase 유틸 (선택)

```bash
# 앱 버전 관리
bun run version:major
bun run version:minor
bun run version:patch
bun run version:clear

# Supabase CLI (로컬에 supabase CLI 필요)
bun run supabase:login
bun run supabase:type
```

## 8. SonarQube Cloud (CI 품질 게이트)

G5 품질 거버넌스에 따라 CI는 typecheck / lint / stylelint / test+coverage 이후 **SonarQube Cloud** 스캔을 돌립니다.  
`SONAR_TOKEN`이 없으면 해당 스텝만 건너뛰고, 나머지 게이트는 그대로 실행됩니다.

### 8.1 SonarQube Cloud 프로젝트 연결

1. [SonarQube Cloud](https://sonarcloud.io)에 GitHub 계정으로 로그인
2. Organization / Project를 만들고 이 GitHub 레포를 import
3. 프로젝트 키를 확인한 뒤 루트 `sonar-project.properties`와 맞춘다

```properties
sonar.projectKey=artboda-web-nuxt
sonar.projectName=artboda-web-nuxt
```

보일러플레이트를 새 서비스로 복제한 경우 `projectKey` / `projectName`을 서비스명에 맞게 변경하세요.

### 8.2 GitHub Actions Secret 등록

1. GitHub 레포 → **Settings** → **Secrets and variables** → **Actions**
2. `New repository secret`
3. Name: `SONAR_TOKEN`
4. Value: SonarQube Cloud에서 발급한 토큰  
   (My Account → Security → Generate Tokens)

> 토큰은 코드/문서에 넣지 말고 GitHub Secrets에만 보관합니다.

### 8.3 동작 확인

1. `develop` / `staging` / `main` 대상 PR을 생성하거나 push
2. Actions → **ci** 워크플로우에서 아래 스텝이 보이는지 확인
   - Typecheck / Lint / Stylelint / Test with coverage
   - **SonarQube Cloud Scan** (`SONAR_TOKEN` 있을 때만)
3. PR에 SonarQube 품질 코멘트(Maintainability / Reliability / Security, 신규 코드 커버리지)가 달리면 성공

### 8.4 참고

| 항목 | 내용 |
|------|------|
| 워크플로우 | `.github/workflows/ci.yml` |
| 설정 파일 | `sonar-project.properties` |
| 커버리지 리포트 | `coverage/lcov.info` (Vitest `--coverage`) |
| 무료 한도 | 프라이빗 레포 기준 약 5만 LOC / 5인 (초과 시 유료 전환 검토) |

## 빠른 시작 요약

```bash
# 1) Bun 설치 (최초 1회)
curl -fsSL https://bun.sh/install | bash

# 2) 의존성 설치
bun install

# 3) 환경 변수 설정
cp .env.example .env   # 또는 .env 직접 작성

# 4) 개발 서버
bun run dev
```

SonarQube까지 쓰려면 **§8** 대로 `SONAR_TOKEN`을 GitHub Secrets에 등록하세요.
