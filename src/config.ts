/* ============================================
 * CONFIGURATION
 * ============================================ */

/**
 * 환경 변수 타입 정의
 */
export interface Env {
  MY_DOMAIN: string
  ROOT_PAGE_ID: string
  PAGE_TITLE?: string
  PAGE_DESCRIPTION?: string
  GOOGLE_FONT?: string
  CUSTOM_SCRIPT?: string
}

/**
 * 설정 객체 생성
 */
export function createConfig(env: Env) {
  const MY_DOMAIN = env.MY_DOMAIN
  const ROOT_PAGE_ID = env.ROOT_PAGE_ID
  const PAGE_TITLE = env.PAGE_TITLE || ''
  const PAGE_DESCRIPTION = env.PAGE_DESCRIPTION || ''
  const GOOGLE_FONT = env.GOOGLE_FONT || ''
  const CUSTOM_SCRIPT = env.CUSTOM_SCRIPT || ''

  // URL 슬러그 → Notion 페이지 ID 매핑
  const SLUG_TO_PAGE: Record<string, string> = {
    '': ROOT_PAGE_ID,
  }

  // 슬러그 매핑 역방향 생성
  const PAGE_TO_SLUG: Record<string, string> = {}
  const slugs: string[] = []
  const pages: string[] = []

  Object.keys(SLUG_TO_PAGE).forEach((slug) => {
    const page = SLUG_TO_PAGE[slug]
    slugs.push(slug)
    pages.push(page)
    PAGE_TO_SLUG[page] = slug
  })

  return {
    MY_DOMAIN,
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
