import { Context } from 'hono'
import { Config } from './config'
import { applyHtmlRewriters } from './rewriters'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'

function rewriteDomainInBody(body: string, myDomain: string): string {
  return body
    .replace(/[a-z0-9-]+\.notion\.site/g, myDomain)
    .replace(/www\.notion\.so/g, myDomain)
}

export function createProxyHandler(config: Config) {
  const {
    MY_DOMAIN,
    NOTION_SITE_DOMAIN,
    NOTION_SPACE_DOMAIN,
    CUSTOM_SPACE_DOMAIN,
    PARENT_DOMAIN,
    SLUG_TO_PAGE,
    PAGE_TO_SLUG,
    slugs,
    pages,
  } = config

  return async function handleProxy(c: Context): Promise<Response> {
    const reqUrl = new URL(c.req.url)

    // notion.site 도메인으로 URL 변환
    reqUrl.hostname = NOTION_SITE_DOMAIN

    const path = reqUrl.pathname

    // 1. /app/*.js, /_assets/*.js → Notion JS 프록시 (도메인 치환)
    const isJs =
      (path.startsWith('/app') || path.startsWith('/_assets/')) && path.endsWith('.js')
    if (isJs) {
      const response = await fetch(reqUrl.toString())
      let body = await response.text()
      body = rewriteDomainInBody(body, MY_DOMAIN)
        .replace(/"notion\.site"/g, `"${PARENT_DOMAIN}"`)
      return new Response(body, {
        status: response.status,
        headers: { 'Content-Type': 'text/javascript' },
      })
    }

    // 2. /api/v3/getPublicPageData → spaceDomain/publicDomainName 리라이팅
    if (path.startsWith('/api/v3/getPublicPageData')) {
      let reqBody = await c.req.text()
      reqBody = reqBody.replace(new RegExp(CUSTOM_SPACE_DOMAIN, 'g'), NOTION_SPACE_DOMAIN)

      // root URL에서 blockId 없으면 주입
      try {
        const json = JSON.parse(reqBody)
        if (!json.blockId && SLUG_TO_PAGE['']) {
          json.blockId = SLUG_TO_PAGE[''].replace(
            /(.{8})(.{4})(.{4})(.{4})(.{12})/,
            '$1-$2-$3-$4-$5'
          )
          reqBody = JSON.stringify(json)
        }
      } catch {}

      const response = await fetch(reqUrl.toString(), {
        method: 'POST',
        body: reqBody,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'user-agent': USER_AGENT,
        },
      })

      let body = await response.text()
      body = rewriteDomainInBody(body, MY_DOMAIN)

      try {
        const json = JSON.parse(body)
        if (json.spaceDomain) json.spaceDomain = CUSTOM_SPACE_DOMAIN
        if (json.publicDomainName) json.publicDomainName = PARENT_DOMAIN
        delete json.requireInterstitial
        json.requestedOnExternalDomain = false
        body = JSON.stringify(json)
      } catch {}

      const newResponse = new Response(body, response)
      newResponse.headers.set('Access-Control-Allow-Origin', '*')
      newResponse.headers.delete('Content-Security-Policy')
      return newResponse
    }

    // 3. /api/* → Notion API 프록시 (도메인 리라이팅)
    if (path.startsWith('/api')) {
      let reqBody = await c.req.text()
      reqBody = reqBody.replace(new RegExp(CUSTOM_SPACE_DOMAIN, 'g'), NOTION_SPACE_DOMAIN)

      const response = await fetch(reqUrl.toString(), {
        method: 'POST',
        body: reqBody,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'user-agent': USER_AGENT,
        },
      })

      let body = await response.text()
      body = rewriteDomainInBody(body, MY_DOMAIN)
      body = body.replace(new RegExp(NOTION_SPACE_DOMAIN, 'g'), CUSTOM_SPACE_DOMAIN)

      const newResponse = new Response(body, response)
      newResponse.headers.set('Access-Control-Allow-Origin', '*')
      newResponse.headers.delete('Content-Security-Policy')
      return newResponse
    }

    // 4. /login → 홈으로 리다이렉트
    if (path === '/login') {
      return c.redirect(`https://${MY_DOMAIN}/`, 302)
    }

    // 5. /{slug} → 해당 페이지 직접 프록시 (리다이렉트 대신)
    const pathSlug = path.slice(1).split('?')[0]
    let currentSlug = ''

    if (slugs.includes(pathSlug)) {
      const pageId = SLUG_TO_PAGE[pathSlug]
      reqUrl.pathname = '/' + pageId
      currentSlug = pathSlug
    } else {
      // 페이지 ID에서 슬러그 역매핑
      const idMatch = path.match(/[0-9a-f]{32}/)
      if (idMatch) {
        currentSlug = PAGE_TO_SLUG[idMatch[0]] || ''
      }
    }

    // 6. 일반 프록시
    const response = await fetch(reqUrl.toString(), {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    })

    const newResponse = new Response(response.body, response)
    newResponse.headers.delete('Content-Security-Policy')
    newResponse.headers.delete('X-Content-Security-Policy')

    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('text/html')) {
      return applyHtmlRewriters(newResponse, config, currentSlug)
    }

    return newResponse
  }
}
