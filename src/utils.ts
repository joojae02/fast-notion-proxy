import { Config } from './config'

/**
 * XML 사이트맵 생성
 */
export function generateSitemap(config: Config): string {
  const { MY_DOMAIN, slugs } = config
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>'
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

  slugs.forEach((slug) => {
    sitemap += `<url><loc>https://${MY_DOMAIN}/${slug}</loc></url>`
  })

  sitemap += '</urlset>'
  return sitemap
}

/**
 * robots.txt 내용 생성
 */
export function generateRobotsTxt(config: Config): string {
  const { MY_DOMAIN } = config
  return `User-agent: *
Allow: /

Sitemap: https://${MY_DOMAIN}/sitemap.xml`
}

/**
 * CORS 헤더
 */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * CORS preflight 요청 처리
 */
export function handleCorsPreflightResponse(request: Request): Response {
  const origin = request.headers.get('Origin')
  const accessControlRequestMethod = request.headers.get('Access-Control-Request-Method')
  const accessControlRequestHeaders = request.headers.get('Access-Control-Request-Headers')

  if (origin && accessControlRequestMethod && accessControlRequestHeaders) {
    // CORS preflight 요청
    return new Response(null, { headers: corsHeaders })
  }

  // 일반 OPTIONS 요청
  return new Response(null, {
    headers: { Allow: 'GET, HEAD, POST, PUT, OPTIONS' },
  })
}

/**
 * 32자 hex 패턴 체크 (Notion 페이지 ID)
 */
export function isNotionPageId(str: string): boolean {
  return /^[0-9a-f]{32}$/.test(str)
}
