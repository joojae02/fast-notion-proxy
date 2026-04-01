import { Config } from './config'

export function createMetaRewriter(config: Config, slug: string): HTMLRewriterElementContentHandlers {
  const { MY_DOMAIN, PAGE_TITLE, PAGE_DESCRIPTION } = config

  return {
    element(element: Element): void {
      // noindex 제거
      if (element.getAttribute('name') === 'robots') {
        const content = element.getAttribute('content')
        if (content && content.includes('noindex')) {
          element.remove()
          return
        }
      }

      if (element.tagName === 'title' && PAGE_TITLE) {
        element.setInnerContent(PAGE_TITLE)
      }

      if (PAGE_TITLE) {
        const property = element.getAttribute('property')
        const name = element.getAttribute('name')
        if (property === 'og:title' || name === 'twitter:title') {
          element.setAttribute('content', PAGE_TITLE)
        }
      }

      if (PAGE_DESCRIPTION) {
        const property = element.getAttribute('property')
        const name = element.getAttribute('name')
        if (
          name === 'description' ||
          property === 'og:description' ||
          name === 'twitter:description'
        ) {
          element.setAttribute('content', PAGE_DESCRIPTION)
        }
      }

      // OG/Twitter URL을 커스텀 도메인으로
      const property = element.getAttribute('property')
      const name = element.getAttribute('name')
      if (property === 'og:url' || name === 'twitter:url') {
        const canonicalUrl = `https://${MY_DOMAIN}${slug ? '/' + slug : ''}`
        element.setAttribute('content', canonicalUrl)
      }

      // Apple 앱 배너 제거
      if (element.getAttribute('name') === 'apple-itunes-app') {
        element.remove()
      }
    },
  }
}

export function createHeadRewriter(config: Config, slug: string): HTMLRewriterElementContentHandlers {
  const { MY_DOMAIN, GOOGLE_FONT } = config

  return {
    element(element: Element): void {
      // canonical URL + robots
      const canonicalUrl = `https://${MY_DOMAIN}${slug ? '/' + slug : ''}`
      element.append(`<link rel="canonical" href="${canonicalUrl}">`, { html: true })
      element.append(`<meta name="robots" content="index, follow">`, { html: true })

      // Google Fonts
      if (GOOGLE_FONT) {
        const fontUrl = `https://fonts.googleapis.com/css?family=${GOOGLE_FONT.replace(/ /g, '+')}:Regular,Bold,Italic&display=swap`
        element.append(
          `<link href="${fontUrl}" rel="stylesheet">
          <style>* { font-family: "${GOOGLE_FONT}" !important; }</style>`,
          { html: true }
        )
      }

      // Notion 상단바 UI 숨기기
      element.append(
        `<style>
      div.notion-topbar > div > div:nth-child(3) { display: none !important; }
      div.notion-topbar > div > div:nth-child(4) { display: none !important; }
      div.notion-topbar > div > div:nth-child(5) { display: none !important; }
      div.notion-topbar > div > div:nth-child(6) { display: none !important; }
      div.notion-topbar-mobile > div:nth-child(3) { display: none !important; }
      div.notion-topbar-mobile > div:nth-child(4) { display: none !important; }
      div.notion-topbar > div > div:nth-child(1n).toggle-mode { display: block !important; }
      div.notion-topbar-mobile > div:nth-child(1n).toggle-mode { display: block !important; }
      </style>`,
        { html: true }
      )
    },
  }
}

export function createBodyRewriter(config: Config): HTMLRewriterElementContentHandlers {
  const { MY_DOMAIN, NOTION_SITE_DOMAIN, SLUG_TO_PAGE, CUSTOM_SCRIPT } = config

  return {
    element(element: Element): void {
      element.append(
        `<script>
      window.CONFIG.domainBaseUrl = 'https://${MY_DOMAIN}';
      const SLUG_TO_PAGE = ${JSON.stringify(SLUG_TO_PAGE)};
      const PAGE_TO_SLUG = {};
      const slugs = [];
      const pages = [];
      const el = document.createElement('div');
      let redirected = false;
      Object.keys(SLUG_TO_PAGE).forEach(slug => {
        const page = SLUG_TO_PAGE[slug];
        slugs.push(slug);
        pages.push(page);
        PAGE_TO_SLUG[page] = slug;
      });
      function getPage() {
        const match = location.pathname.match(/[0-9a-f]{32}/);
        return match ? match[0] : '';
      }
      function getSlug() {
        return location.pathname.slice(1);
      }
      function updateSlug() {
        const slug = PAGE_TO_SLUG[getPage()];
        if (slug != null) {
          history.replaceState(history.state, '', '/' + slug);
        }
      }
      function onDark() {
        el.innerHTML = '<div title="Change to Light Mode" style="margin-left: auto; margin-right: 14px; min-width: 0px;"><div role="button" tabindex="0" style="user-select: none; transition: background 120ms ease-in 0s; cursor: pointer; border-radius: 44px;"><div style="display: flex; flex-shrink: 0; height: 14px; width: 26px; border-radius: 44px; padding: 2px; box-sizing: content-box; background: rgb(46, 170, 220); transition: background 200ms ease 0s, box-shadow 200ms ease 0s;"><div style="width: 14px; height: 14px; border-radius: 44px; background: white; transition: transform 200ms ease-out 0s, background 200ms ease-out 0s; transform: translateX(12px) translateY(0px);"></div></div></div></div>';
        document.body.classList.add('dark');
        __console.environment.ThemeStore.setState({ mode: 'dark' });
      }
      function onLight() {
        el.innerHTML = '<div title="Change to Dark Mode" style="margin-left: auto; margin-right: 14px; min-width: 0px;"><div role="button" tabindex="0" style="user-select: none; transition: background 120ms ease-in 0s; cursor: pointer; border-radius: 44px;"><div style="display: flex; flex-shrink: 0; height: 14px; width: 26px; border-radius: 44px; padding: 2px; box-sizing: content-box; background: rgba(135, 131, 120, 0.3); transition: background 200ms ease 0s, box-shadow 200ms ease 0s;"><div style="width: 14px; height: 14px; border-radius: 44px; background: white; transition: transform 200ms ease-out 0s, background 200ms ease-out 0s; transform: translateX(0px) translateY(0px);"></div></div></div></div>';
        document.body.classList.remove('dark');
        __console.environment.ThemeStore.setState({ mode: 'light' });
      }
      function toggle() {
        if (document.body.classList.contains('dark')) onLight();
        else onDark();
      }
      function addDarkModeButton(device) {
        const nav = device === 'web'
          ? document.querySelector('.notion-topbar').firstChild
          : document.querySelector('.notion-topbar-mobile');
        el.className = 'toggle-mode';
        el.addEventListener('click', toggle);
        nav.appendChild(el);
        onLight();
      }
      const observer = new MutationObserver(function() {
        if (redirected) return;
        const nav = document.querySelector('.notion-topbar');
        const mobileNav = document.querySelector('.notion-topbar-mobile');
        if ((nav && nav.firstChild && nav.firstChild.firstChild) ||
            (mobileNav && mobileNav.firstChild)) {
          redirected = true;
          updateSlug();
          addDarkModeButton(nav ? 'web' : 'mobile');
          const onpopstate = window.onpopstate;
          window.onpopstate = function() {
            if (slugs.includes(getSlug())) {
              const page = SLUG_TO_PAGE[getSlug()];
              if (page) {
                history.replaceState(history.state, 'bypass', '/' + page);
              }
            }
            onpopstate.apply(this, [].slice.call(arguments));
            updateSlug();
          };
        }
      });
      observer.observe(document.querySelector('#notion-app'), {
        childList: true,
        subtree: true,
      });
      setTimeout(function() {
        if (!redirected) {
          redirected = true;
          updateSlug();
          const onpopstate = window.onpopstate;
          window.onpopstate = function() {
            if (slugs.includes(getSlug())) {
              const page = SLUG_TO_PAGE[getSlug()];
              if (page) {
                history.replaceState(history.state, 'bypass', '/' + page);
              }
            }
            onpopstate.apply(this, [].slice.call(arguments));
            updateSlug();
          };
        }
      }, 2000);
      const replaceState = window.history.replaceState;
      window.history.replaceState = function(state) {
        if (arguments[1] !== 'bypass' && slugs.includes(getSlug())) return;
        return replaceState.apply(window.history, arguments);
      };
      const pushState = window.history.pushState;
      window.history.pushState = function(state) {
        const dest = new URL(location.protocol + location.host + arguments[2]);
        const idMatch = dest.pathname.match(/[0-9a-f]{32}/);
        const id = idMatch ? idMatch[0] : '';
        if (id && pages.includes(id)) {
          arguments[2] = '/' + PAGE_TO_SLUG[id];
        }
        return pushState.apply(window.history, arguments);
      };
      const open = window.XMLHttpRequest.prototype.open;
      window.XMLHttpRequest.prototype.open = function() {
        arguments[1] = arguments[1].replace('${MY_DOMAIN}', '${NOTION_SITE_DOMAIN}');
        return open.apply(this, [].slice.call(arguments));
      };
    </script>${CUSTOM_SCRIPT || ''}`,
        { html: true }
      )
    },
  }
}

export function applyHtmlRewriters(response: Response, config: Config, slug: string): Response {
  return new HTMLRewriter()
    .on('title', createMetaRewriter(config, slug))
    .on('meta', createMetaRewriter(config, slug))
    .on('head', createHeadRewriter(config, slug))
    .on('body', createBodyRewriter(config))
    .transform(response)
}
