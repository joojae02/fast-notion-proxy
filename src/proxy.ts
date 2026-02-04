import { Context } from 'hono'
import { Config } from './config'
import { applyHtmlRewriters } from './rewriters'
import { isNotionPageId } from './utils'

// 브라우저 User-Agent (봇 감지 회피용)
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'

/**
 * Notion API 프록시
 * /api/* 요청을 www.notion.so로 전달
 */
async function proxyNotionApi(path: string, body: ReadableStream<Uint8Array> | null): Promise<Response> {
  const url = `https://www.notion.so${path}`

  // getPublicPageData는 body 없이 요청
  const requestBody = path.includes('/api/v3/getPublicPageData') ? null : body

  const response = await fetch(url, {
    method: 'POST',
    body: requestBody,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'user-agent': BROWSER_USER_AGENT,
    },
  })

  // 응답 복제 후 CORS 헤더 추가
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')

  return newResponse
}

/**
 * Notion JS 파일 프록시
 * /app/*.js 파일 내 도메인을 커스텀 도메인으로 치환
 */
async function proxyNotionJs(path: string, myDomain: string): Promise<Response> {
  const url = `https://www.notion.so${path}`
  const response = await fetch(url)

  let body = await response.text()
  body = body
    .replace(/www\.notion\.so/g, myDomain)
    .replace(/notion\.so/g, myDomain)

  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/x-javascript',
    },
  })
}

/**
 * 일반 요청 프록시
 * HTML 응답에는 HTMLRewriter 적용
 */
async function proxyNotionPage(request: Request, path: string, config: Config): Promise<Response> {
  const url = `https://www.notion.so${path}`

  // Accept-Encoding 제거하여 압축되지 않은 응답 받기 (HTMLRewriter용)
  const headers = new Headers(request.headers)
  headers.delete('Accept-Encoding')

  const response = await fetch(url, {
    method: request.method,
    headers,
    body: request.body,
  })

  // 응답 복제
  const newResponse = new Response(response.body, response)

  // CSP 헤더 제거 (커스텀 스크립트 허용)
  newResponse.headers.delete('Content-Security-Policy')
  newResponse.headers.delete('X-Content-Security-Policy')

  // HTML 응답이면 HTMLRewriter 적용
  const contentType = response.headers.get('Content-Type') || ''
  if (contentType.includes('text/html')) {
    return applyHtmlRewriters(newResponse, config)
  }

  return newResponse
}

/**
 * 메인 프록시 핸들러
 */
export function createProxyHandler(config: Config) {
  const { MY_DOMAIN, SLUG_TO_PAGE, slugs, pages } = config

  return async function handleProxy(c: Context): Promise<Response> {
    const url = new URL(c.req.url)
    const path = url.pathname + url.search

    // 1. /app/*.js - Notion JS 파일 (도메인 치환)
    if (path.startsWith('/app') && path.endsWith('.js')) {
      return proxyNotionJs(path, MY_DOMAIN)
    }

    // 2. /api/* - Notion API
    if (path.startsWith('/api')) {
      return proxyNotionApi(path, c.req.raw.body)
    }

    // 3. /{slug} - 슬러그 → 페이지 ID 리다이렉트
    const pathWithoutSlash = path.slice(1).split('?')[0]
    const protocol = MY_DOMAIN.includes('localhost') ? 'http' : 'https'
    if (slugs.includes(pathWithoutSlash)) {
      const pageId = SLUG_TO_PAGE[pathWithoutSlash]
      return c.redirect(`${protocol}://${MY_DOMAIN}/${pageId}`, 301)
    }

    // 4. /{32자 hex} - 미등록 페이지 ID → 홈으로 리다이렉트
    if (!pages.includes(pathWithoutSlash) && isNotionPageId(pathWithoutSlash)) {
      return c.redirect(`${protocol}://${MY_DOMAIN}`, 301)
    }

    // 5. 기타 - 투명 프록시
    return proxyNotionPage(c.req.raw, path, config)
  }
}
