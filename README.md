# Fast Notion Proxy

Notion 공개 페이지를 커스텀 도메인에서 서비스할 수 있는 리버스 프록시입니다. Cloudflare Workers 기반으로 빠르고 무료로 운영할 수 있습니다.

## Features

- **커스텀 도메인**: Notion 페이지를 자신의 도메인에서 서비스
- **SEO 최적화**: 메타 태그 커스터마이징 (title, description, og tags)
- **Pretty URLs**: 긴 Notion 페이지 ID 대신 깔끔한 슬러그 사용
- **다크모드 토글**: 시스템 설정 연동 + 수동 토글 버튼
- **Notion UI 정리**: 불필요한 상단바 요소 숨김
- **Google Fonts**: 커스텀 폰트 적용 가능
- **빠른 응답**: Cloudflare 글로벌 엣지 네트워크 활용

## Quick Start

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone https://github.com/your-username/fast-notion-proxy.git
cd fast-notion-proxy
pnpm install
```

### 2. Notion 페이지 준비

1. Notion에서 공개할 페이지를 엽니다
2. 우측 상단 **Share** → **Publish** → **Publish to web** 활성화
3. URL에서 페이지 ID를 복사합니다:
   ```
   https://www.notion.so/abc123def456789...
                         ^^^^^^^^^^^^^^^^^^^^
                         이 32자가 페이지 ID입니다
   ```

### 3. 환경 변수 설정

`wrangler.jsonc`에서 직접 수정하거나, `.dev.vars` 파일을 생성합니다:

```bash
cp .dev.vars.example .dev.vars
```

```bash
# .dev.vars
MY_DOMAIN=localhost:8787
ROOT_PAGE_ID=your-notion-page-id-here
```

### 4. 로컬 개발 서버 실행

```bash
pnpm run dev
```

브라우저에서 `http://localhost:8787` 접속하여 확인합니다.

### 5. Cloudflare에 배포

```bash
pnpm run deploy
```

## Configuration

### 환경 변수

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `MY_DOMAIN` | ✅ | 커스텀 도메인 | `blog.example.com` |
| `ROOT_PAGE_ID` | ✅ | 루트 Notion 페이지 ID (32자) | `59a98d76552f4aae8067fb4fc9b11a79` |
| `PAGE_TITLE` | ❌ | 사이트 타이틀 (SEO) | `My Blog` |
| `PAGE_DESCRIPTION` | ❌ | 사이트 설명 (SEO) | `Welcome to my blog` |
| `GOOGLE_FONT` | ❌ | Google Fonts 폰트명 | `Noto Sans KR` |
| `CUSTOM_SCRIPT` | ❌ | 커스텀 스크립트 (GA 등) | `<script>...</script>` |

### 설정 방법

**방법 1: wrangler.jsonc (권장)**

```jsonc
{
  "vars": {
    "MY_DOMAIN": "blog.example.com",
    "ROOT_PAGE_ID": "59a98d76552f4aae8067fb4fc9b11a79",
    "PAGE_TITLE": "My Blog",
    "PAGE_DESCRIPTION": "Welcome to my blog"
  }
}
```

**방법 2: .dev.vars (로컬 개발용)**

```bash
MY_DOMAIN=localhost:8787
ROOT_PAGE_ID=59a98d76552f4aae8067fb4fc9b11a79
```

**방법 3: Cloudflare Dashboard (프로덕션)**

Workers & Pages → 해당 Worker → Settings → Variables에서 설정

## Custom Domain Setup

`wrangler.jsonc`에서 `routes` 주석을 해제하고 도메인을 설정합니다:

```jsonc
{
  "vars": {
    "MY_DOMAIN": "blog.example.com",
    "ROOT_PAGE_ID": "..."
  },
  "routes": [
    {
      "pattern": "blog.example.com",
      "custom_domain": true
    }
  ]
}
```

> **Note**: 도메인이 Cloudflare DNS에 등록되어 있어야 합니다.

## Project Structure

```
src/
├── index.ts      # Hono 앱 엔트리포인트
├── config.ts     # 환경 변수 기반 설정
├── proxy.ts      # Notion 프록시 로직
├── rewriters.ts  # HTMLRewriter (메타태그, 스타일, 스크립트)
└── utils.ts      # 유틸리티 (sitemap, robots.txt, CORS)
```

## How It Works

1. **요청 수신**: 커스텀 도메인으로 들어오는 모든 요청을 Workers가 처리
2. **Notion 프록시**: 요청을 `www.notion.so`로 전달
3. **JS 치환**: Notion JS 파일 내 도메인을 커스텀 도메인으로 변환
4. **HTML 변환**: HTMLRewriter로 메타태그 수정, 스타일/스크립트 주입
5. **응답 반환**: 변환된 콘텐츠를 클라이언트에 전달

## Commands

```bash
pnpm install        # 의존성 설치
pnpm run dev        # 로컬 개발 서버 (localhost:8787)
pnpm run deploy     # Cloudflare Workers 배포
pnpm run cf-typegen # wrangler 타입 생성
```

## Limitations

- Notion 페이지가 **Publish to web**으로 공개되어 있어야 합니다
- 데이터베이스 뷰, 코멘트 등 일부 인터랙티브 기능은 제한될 수 있습니다
- Notion의 정책 변경에 따라 동작이 달라질 수 있습니다

## License

MIT
