import { Hono } from 'hono'
import { Env, createConfig } from './config'
import { createProxyHandler } from './proxy'
import {
  generateSitemap,
  generateRobotsTxt,
  handleCorsPreflightResponse,
} from './utils'

const app = new Hono<{ Bindings: Env }>()

// CORS preflight 처리
app.options('*', (c) => {
  return handleCorsPreflightResponse(c.req.raw)
})

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
app.all('*', (c) => {
  const config = createConfig(c.env)
  const handleProxy = createProxyHandler(config)
  return handleProxy(c)
})

export default app
