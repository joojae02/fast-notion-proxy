import { Config } from './config'

export function generateSitemap(config: Config): string {
  const { MY_DOMAIN, slugs } = config
  let sitemap = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  slugs.forEach((slug) => {
    sitemap += `<url><loc>https://${MY_DOMAIN}/${slug}</loc></url>`
  })
  sitemap += '</urlset>'
  return sitemap
}

export function generateRobotsTxt(config: Config): string {
  return `Sitemap: https://${config.MY_DOMAIN}/sitemap.xml`
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function handleCorsPreflightResponse(request: Request): Response {
  const origin = request.headers.get('Origin')
  const method = request.headers.get('Access-Control-Request-Method')
  const headers = request.headers.get('Access-Control-Request-Headers')

  if (origin && method && headers) {
    return new Response(null, { headers: corsHeaders })
  }
  return new Response(null, {
    headers: { Allow: 'GET, HEAD, POST, PUT, OPTIONS' },
  })
}
