# Fast Notion Proxy

Notion 공개 페이지를 커스텀 도메인에서 서비스할 수 있는 리버스 프록시입니다. Cloudflare Workers 기반으로 빠르고 무료로 운영할 수 있습니다.

https://github.com/joojae02/fast-notion-proxy

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
git clone https://github.com/joojae02/fast-notion-proxy.git
cd fast-notion-proxy
pnpm install
```

### 2. Notion 페이지 준비

1. Notion에서 공개할 페이지를 엽니다
2. 우측 상단 **Share** → **Publish** → **Publish to web**을 활성화합니다
3. 공개된 페이지 URL을 복사합니다 (예: `https://your-space.notion.site/My-Page-59a98d76552f4aae8067fb4fc9b11a79`)

### 3. 환경 변수 설정

프로젝트 루트에 `.dev.vars` 파일을 생성합니다:

```bash
# .dev.vars
MY_DOMAIN=localhost:8787
NOTION_URL=https://your-space.notion.site/My-Page-59a98d76552f4aae8067fb4fc9b11a79
```

> `NOTION_URL`은 Notion에서 Publish한 페이지의 전체 URL입니다. `*.notion.site` 형식이어야 합니다.

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
| --- | --- | --- | --- |
| `MY_DOMAIN` | ✅ | 커스텀 도메인 | `blog.example.com` |
| `NOTION_URL` | ✅ | Notion 공개 페이지 URL | `https://abc.notion.site/Page-59a98d76...` |
| `SLUG_TO_PAGE` | ❌ | 슬러그 → 페이지 ID 매핑 (JSON) | `{"about":"abcdef...","blog":"123456..."}` |
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
    "NOTION_URL": "https://your-space.notion.site/Page-59a98d76552f4aae8067fb4fc9b11a79",
    "SLUG_TO_PAGE": "{\"about\":\"abcdef01234567890abcdef012345678\"}",
    "PAGE_TITLE": "My Blog",
    "PAGE_DESCRIPTION": "Welcome to my blog"
  }
}
```

**방법 2: .dev.vars (로컬 개발)**

```bash
MY_DOMAIN=localhost:8787
NOTION_URL=https://your-space.notion.site/Page-59a98d76552f4aae8067fb4fc9b11a79
```

**방법 3: Cloudflare Dashboard (프로덕션)**

Workers & Pages → 해당 Worker → Settings → Variables에서 설정

### 슬러그 설정

`SLUG_TO_PAGE`를 사용하면 Pretty URL을 만들 수 있습니다:

```jsonc
// wrangler.jsonc
{
  "vars": {
    "SLUG_TO_PAGE": "{\"about\":\"abcdef01234567890abcdef012345678\",\"blog\":\"12345678abcdef01234567890abcdef0\"}"
  }
}
```

이렇게 설정하면:
- `blog.example.com/about` → Notion 페이지 `abcdef01234567890abcdef012345678`
- `blog.example.com/blog` → Notion 페이지 `12345678abcdef01234567890abcdef0`

> 페이지 ID는 Notion URL에서 마지막 32자 hex 문자열입니다.
> 예: `https://abc.notion.site/My-Page-**59a98d76552f4aae8067fb4fc9b11a79**`

## Custom Domain Setup

`wrangler.jsonc`에서 `routes` 주석을 해제하고 도메인을 설정합니다:

```jsonc
{
  "vars": {
    "MY_DOMAIN": "blog.example.com",
    "NOTION_URL": "https://your-space.notion.site/Page-59a98d76552f4aae8067fb4fc9b11a79"
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
├── config.ts     # 환경 변수 파싱, 도메인 계산, 슬러그 매핑
├── proxy.ts      # Notion 프록시 로직 (JS/API/페이지)
├── rewriters.ts  # HTMLRewriter (메타태그, 스타일, 클라이언트 스크립트)
└── utils.ts      # 유틸리티 (sitemap, robots.txt, CORS)
```

## How It Works

1. **요청 수신**: 커스텀 도메인으로 들어오는 모든 요청을 Workers가 처리
2. **Notion 프록시**: `*.notion.site`로 요청을 전달하고 응답을 받아옴
3. **도메인 리라이팅**: JS/API 응답에서 Notion 도메인을 커스텀 도메인으로 치환
4. **HTML 변환**: HTMLRewriter로 메타태그, 스타일, 클라이언트 스크립트 주입
5. **응답 전달**: 변환된 응답을 클라이언트에게 전달

### 프록시 라우팅

| 경로 | 처리 |
| --- | --- |
| `/robots.txt` | sitemap URL 포함한 robots.txt 생성 |
| `/sitemap.xml` | 슬러그 기반 사이트맵 생성 |
| `/_assets/*.js`, `/app/*.js` | Notion JS 프록시 + 도메인 치환 |
| `/api/v3/getPublicPageData` | spaceDomain/publicDomainName 리라이팅 |
| `/api/*` | Notion API 프록시 + 도메인 리라이팅 |
| `/login` | 홈으로 리다이렉트 |
| `/{slug}` | 슬러그에 해당하는 Notion 페이지 프록시 |
| `/*` | 그 외 모든 요청을 투명 프록시 |

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

---

# 튜토리얼 (처음부터 끝까지)

Cloudflare 가입부터 커스텀 도메인 배포까지 전 과정을 안내합니다.

---

## Step 1. 사전 준비

아래 도구들이 설치되어 있어야 합니다:

- **Node.js** (v18 이상): https://nodejs.org
- **pnpm**: Node.js 설치 후 아래 명령어로 설치
    ```bash
    npm install -g pnpm
    ```
- **Git**: https://git-scm.com

---

## Step 2. Cloudflare 가입

1. [Cloudflare 회원가입 페이지](https://dash.cloudflare.com/sign-up)에 접속합니다
2. 이메일과 비밀번호를 입력하여 계정을 생성합니다
3. 이메일 인증을 완료합니다

---

## Step 3. 도메인 준비

커스텀 도메인이 필요합니다. 두 가지 방법 중 하나를 선택하세요.

### Step 3-A. Cloudflare에서 도메인 구매

1. Cloudflare Dashboard → **Domain Registration** → **Register Domains**
2. 원하는 도메인을 검색합니다 (예: `mysite.com`)
3. 사용 가능한 도메인을 선택하고 **Purchase** 버튼을 클릭합니다
4. 결제 정보를 입력하고 구매를 완료합니다
5. 구매가 완료되면 Cloudflare DNS에 자동으로 등록됩니다

### Step 3-B. 기존 도메인을 Cloudflare로 이전

다른 곳에서 구매한 도메인을 사용하려면 Cloudflare DNS로 연결해야 합니다:

1. Cloudflare Dashboard에서 **Websites** → **Add a site**를 클릭합니다
2. 보유한 도메인을 입력합니다 (예: `mysite.com`)
3. **Free** 플랜을 선택합니다
4. Cloudflare가 제공하는 **네임서버 2개**를 복사합니다
    ```
    예시:
    ns1.cloudflare.com
    ns2.cloudflare.com
    ```
5. 기존 도메인 등록업체(가비아, Namecheap 등)에 로그인합니다
6. 도메인의 **네임서버**를 Cloudflare 네임서버로 변경합니다
7. 네임서버 변경이 반영될 때까지 대기합니다 (보통 수 분 ~ 최대 24시간)
8. Cloudflare Dashboard에서 도메인 상태가 **Active**로 변경되면 완료입니다

---

## Step 4. Notion 페이지 공개 설정

1. Notion에서 공개할 페이지를 엽니다
2. 우측 상단 **Share** 버튼을 클릭합니다
3. **Publish** 탭에서 **Publish to web**을 활성화합니다
4. 공개된 페이지 URL을 복사합니다
    ```
    예: https://precious-stove-155.notion.site/My-Page-59a98d76552f4aae8067fb4fc9b11a79
    ```

> `*.notion.site` 형식의 URL을 사용해야 합니다.

---

## Step 5. 프로젝트 설정

```bash
# 프로젝트 클론
git clone https://github.com/joojae02/fast-notion-proxy.git
cd fast-notion-proxy

# 의존성 설치
pnpm install
```

`wrangler.jsonc`를 열어 환경 변수를 설정합니다:

```jsonc
{
  "vars": {
    "MY_DOMAIN": "blog.mysite.com",
    "NOTION_URL": "https://precious-stove-155.notion.site/My-Page-59a98d76552f4aae8067fb4fc9b11a79"
  },
  "routes": [
    {
      "pattern": "blog.mysite.com",
      "custom_domain": true
    }
  ]
}
```

---

## Step 6. 로컬 테스트

`.dev.vars` 파일을 생성하여 로컬 개발 환경을 설정합니다:

```bash
MY_DOMAIN=localhost:8787
NOTION_URL=https://precious-stove-155.notion.site/My-Page-59a98d76552f4aae8067fb4fc9b11a79
```

```bash
pnpm run dev
```

`http://localhost:8787`에서 Notion 페이지가 프록시되는지 확인합니다.

---

## Step 7. 배포

```bash
# Cloudflare 로그인 (최초 1회)
pnpm exec wrangler login

# 배포
pnpm run deploy
```

배포가 완료되면 `https://blog.mysite.com`에서 Notion 페이지가 서비스됩니다.

---

## Step 8. (선택) 추가 설정

### SEO 메타태그

```jsonc
{
  "vars": {
    "PAGE_TITLE": "My Blog",
    "PAGE_DESCRIPTION": "개발 블로그입니다"
  }
}
```

### Pretty URL (슬러그)

```jsonc
{
  "vars": {
    "SLUG_TO_PAGE": "{\"about\":\"abcdef01234567890abcdef012345678\",\"resume\":\"12345678abcdef01234567890abcdef0\"}"
  }
}
```

### Google Fonts

```jsonc
{
  "vars": {
    "GOOGLE_FONT": "Noto Sans KR"
  }
}
```

### Google Analytics

```jsonc
{
  "vars": {
    "CUSTOM_SCRIPT": "<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX\"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>"
  }
}
```
