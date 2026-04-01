export interface Env {
  MY_DOMAIN: string
  NOTION_URL: string
  SLUG_TO_PAGE?: string
  PAGE_TITLE?: string
  PAGE_DESCRIPTION?: string
  GOOGLE_FONT?: string
  CUSTOM_SCRIPT?: string
}

export function createConfig(env: Env) {
  const MY_DOMAIN = env.MY_DOMAIN
  const PAGE_TITLE = env.PAGE_TITLE || ''
  const PAGE_DESCRIPTION = env.PAGE_DESCRIPTION || ''
  const GOOGLE_FONT = env.GOOGLE_FONT || ''
  const CUSTOM_SCRIPT = env.CUSTOM_SCRIPT || ''

  // Notion site 도메인 추출 (예: abc-def-123.notion.site)
  let NOTION_SITE_DOMAIN = 'www.notion.so'
  let ROOT_PAGE_ID = ''
  try {
    const notionUrl = new URL(env.NOTION_URL)
    NOTION_SITE_DOMAIN = notionUrl.hostname
    const match = notionUrl.pathname.match(/[0-9a-f]{32}/)
    if (match) ROOT_PAGE_ID = match[0]
  } catch {}

  // notion.site 앞의 서브도메인 (예: abc-def-123)
  const NOTION_SPACE_DOMAIN = NOTION_SITE_DOMAIN.split('.')[0]
  // 커스텀 도메인의 서브도메인 (예: blog from blog.example.com)
  const CUSTOM_SPACE_DOMAIN = MY_DOMAIN.split('.')[0]
  // 커스텀 도메인의 상위 도메인 (예: example.com)
  const PARENT_DOMAIN = MY_DOMAIN.split('.').slice(1).join('.')

  // URL 슬러그 → Notion 페이지 ID 매핑
  const SLUG_TO_PAGE: Record<string, string> = { '': ROOT_PAGE_ID }
  if (env.SLUG_TO_PAGE) {
    try {
      const parsed = JSON.parse(env.SLUG_TO_PAGE)
      Object.assign(SLUG_TO_PAGE, parsed)
    } catch {}
  }

  const PAGE_TO_SLUG: Record<string, string> = {}
  const slugs: string[] = []
  const pages: string[] = []
  for (const [slug, page] of Object.entries(SLUG_TO_PAGE)) {
    slugs.push(slug)
    pages.push(page)
    PAGE_TO_SLUG[page] = slug
  }

  return {
    MY_DOMAIN,
    NOTION_SITE_DOMAIN,
    NOTION_SPACE_DOMAIN,
    CUSTOM_SPACE_DOMAIN,
    PARENT_DOMAIN,
    ROOT_PAGE_ID,
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    GOOGLE_FONT,
    CUSTOM_SCRIPT,
    SLUG_TO_PAGE,
    PAGE_TO_SLUG,
    slugs,
    pages,
  }
}

export type Config = ReturnType<typeof createConfig>
