import { Hono } from 'hono'
import { Env, createConfig } from './config'
import { createProxyHandler } from './proxy'
import { generateSitemap, generateRobotsTxt, handleCorsPreflightResponse } from './utils'

const app = new Hono<{ Bindings: Env }>()

// CORS preflight
app.options('*', (c) => handleCorsPreflightResponse(c.req.raw))

// robots.txt
app.get('/robots.txt', (c) => {
  const config = createConfig(c.env)
  return c.text(generateRobotsTxt(config))
})

// sitemap.xml
app.get('/sitemap.xml', (c) => {
  const config = createConfig(c.env)
  return c.body(generateSitemap(config), 200, {
    'Content-Type': 'application/xml',
  })
})

// 모든 요청을 Notion 프록시로 전달
app.all('*', async (c) => {
  const config = createConfig(c.env)
  const handleProxy = createProxyHandler(config)
  try {
    return await handleProxy(c)
  } catch {
    return c.html(
      `<!DOCTYPE html><html><head><title>Service Unavailable</title></head>
      <body style="font-family:system-ui;text-align:center;padding:60px 20px">
      <h1>502 Bad Gateway</h1>
      <p>The upstream server is temporarily unavailable. Please try again later.</p>
      </body></html>`,
      502
    )
  }
})

export default app
