/**
 * `<head>` для поисковиков и превью в мессенджерах.
 *
 * Фронт — SPA: `index.html` один на все адреса, поэтому метаданные подставляются
 * здесь, на сервере, до отдачи файла. Без этого внутренние страницы получили бы
 * canonical главной и выпали бы из индекса.
 *
 * Этот файл — единственный источник правды. В `index.html` лежат те же значения
 * только для dev-сервера Vite, который раздаёт оболочку без бэкенда.
 */

export const SITE_NAME = 'Сайт Лешота'
export const OG_IMAGE_PATH = '/images/og.jpg'

/** Синонимы имени: ищут и «Лешот», и «Лехот», и латиницей. */
const SITE_KEYWORDS = 'Лешот, Лехот, le-xot, lexot, lexot.dev'

export interface PageMeta {
  title: string
  description: string
  /** `false` — страницу закрываем от индекса (личное, служебное, несуществующее). */
  indexable?: boolean
  /** Canonical, если адрес отличается от пути: например `/db` редиректит на `/db/suggestion`. */
  canonicalPath?: string
  keywords?: string
  /** Разметка schema.org — только у главной. */
  structuredData?: boolean
}

export interface ResolvedPageMeta {
  title: string
  description: string
  indexable: boolean
  canonicalPath: string
  keywords?: string
  structuredData: boolean
}

const PAGES: Record<string, PageMeta> = {
  '/': {
    title: 'Лешот — сайт Лешота',
    description:
      'Сайт Лешота: база игр и кинолент, сетап компьютера, стримы на Twitch, Telegram, GitHub и YouTube.',
    keywords: SITE_KEYWORDS,
    structuredData: true,
  },
  '/pc': {
    title: 'Железяки Лешота — сетап и периферия',
    description:
      'Конфигурация компьютера Лешота: процессор, видеокарта, память, накопители и периферия.',
  },
  '/db': {
    title: 'Советы Лешота — что посмотреть и во что поиграть',
    description: 'Советы Лешота: игры и киноленты, которые он рекомендует.',
    canonicalPath: '/db/suggestion',
  },
  '/db/suggestion': {
    title: 'Советы Лешота — что посмотреть и во что поиграть',
    description: 'Советы Лешота: игры и киноленты, которые он рекомендует.',
  },
  '/db/games': {
    title: 'Игры Лешота — оценки и мнения',
    description: 'База игр Лешота: оценка, статус прохождения и мнение по каждой игре.',
  },
  '/db/anime': {
    title: 'Аниме Лешота — оценки и мнения',
    description: 'База аниме Лешота: оценка, статус просмотра и мнение по каждому тайтлу.',
  },
  '/db/movie': {
    title: 'Фильмы Лешота — оценки и мнения',
    description: 'База фильмов Лешота: оценка, статус просмотра и мнение по каждому фильму.',
  },
  '/db/series': {
    title: 'Сериалы Лешота — оценки и мнения',
    description: 'База сериалов Лешота: оценка, статус просмотра и мнение по каждому сериалу.',
  },
  '/db/cartoon': {
    title: 'Мультфильмы Лешота — оценки и мнения',
    description:
      'База мультфильмов Лешота: оценка, статус просмотра и мнение по каждому мультфильму.',
  },
  '/db/stats': {
    title: 'Статистика Лешота — игры и киноленты',
    description:
      'Сколько игр, фильмов, сериалов, аниме и мультфильмов в базе Лешота и как они распределены по оценкам.',
  },
  '/db/friends': {
    title: 'Друзья Лешота — их оценки',
    description: 'Оценки друзей Лешота на игры и киноленты в общей базе.',
  },
  '/db/wordle': {
    title: 'Вордли Лешота — игра в слова',
    description: 'Вордли от Лешота: угадайте слово дня и попадите в таблицу лидеров.',
  },
  '/db/cocktails': {
    title: 'Коктейли Лешота — рецепты',
    description: 'Коктейли Лешота: рецепты, состав и пропорции.',
  },
}

/** Личные и служебные адреса: в индексе им делать нечего. */
const PRIVATE_PATHS: readonly RegExp[] = [
  /^\/db\/admin(\/|$)/,
  /^\/db\/ratings\/my(\/|$)/,
  /^\/db\/users\/[^/]+\/ratings(\/|$)/,
  /^\/auth\/callback(\/|$)/,
]

/** Адреса, которые попадают в `sitemap.xml` (без редиректов и приватных страниц). */
const SITEMAP_PATHS = Object.keys(PAGES).filter((path) => path !== '/db')

/** Адрес сайта по умолчанию; в проде приходит из `APP_PUBLIC_URL`. */
export const DEFAULT_SITE_URL = 'https://le-xot.dev'

const STRUCTURED_DATA = (base: string) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      url: `${base}/`,
      name: SITE_NAME,
      alternateName: ['Лешот', 'Лехот', 'le-xot', 'lexot', 'lexot.dev'],
      inLanguage: 'ru-RU',
      publisher: { '@id': `${base}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${base}/#person`,
      name: 'Лешот',
      alternateName: ['Лехот', 'le-xot', 'lexot'],
      url: `${base}/`,
      sameAs: [
        'https://t.me/le_xot',
        'https://github.com/le-xot',
        'https://www.twitch.tv/etonelexot',
        'https://www.youtube.com/@le_xot',
        'https://steamcommunity.com/id/le_xot',
        'https://twir.app/s/lexotovo',
      ],
    },
  ],
})

/** Убирает query/hash и хвостовой слэш: `/db/games/` и `/db/games` — одна страница. */
export function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] ?? '/'
  const decoded = safeDecode(withoutQuery)

  if (decoded.length > 1 && decoded.endsWith('/')) return decoded.slice(0, -1)
  return decoded || '/'
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function resolvePageMeta(pathname: string): ResolvedPageMeta {
  const path = normalizePath(pathname)
  const page = PAGES[path]

  if (!page) {
    return {
      title: SITE_NAME,
      description: PAGES['/']!.description,
      indexable: false,
      canonicalPath: path,
      structuredData: false,
    }
  }

  return {
    title: page.title,
    description: page.description,
    indexable: page.indexable !== false && !PRIVATE_PATHS.some((re) => re.test(path)),
    canonicalPath: page.canonicalPath ?? path,
    structuredData: page.structuredData === true,
    ...(page.keywords ? { keywords: page.keywords } : {}),
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Собирает содержимое `<head>` (без служебных `<meta charset>` и viewport —
 * они лежат в `index.html` и от страницы не зависят).
 */
export function renderPageMeta(pathname: string, siteUrl: string): string {
  const meta = resolvePageMeta(pathname)
  const base = siteUrl.replace(/\/+$/, '')
  const canonical = `${base}${meta.canonicalPath === '/' ? '/' : meta.canonicalPath}`
  const ogImage = `${base}${OG_IMAGE_PATH}`
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    ...(meta.keywords ? [`<meta name="keywords" content="${escapeHtml(meta.keywords)}" />`] : []),
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta name="robots" content="${meta.indexable ? 'index,follow' : 'noindex,follow'}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    '<meta property="og:locale" content="ru_RU" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
  ]

  if (meta.structuredData) {
    const json = JSON.stringify(STRUCTURED_DATA(base)).replaceAll('<', '\\u003c')
    tags.push(`<script type="application/ld+json">${json}</script>`)
  }

  return tags.map((tag) => `    ${tag}`).join('\n')
}

const SEO_BLOCK = /<!--seo:start-->[\s\S]*?<!--seo:end-->/

/** Подставляет `<head>` в оболочку `index.html`; без маркеров возвращает файл как есть. */
export function injectPageMeta(html: string, pathname: string, siteUrl: string): string {
  if (!SEO_BLOCK.test(html)) return html

  const block = ['<!--seo:start-->', renderPageMeta(pathname, siteUrl), '    <!--seo:end-->'].join(
    '\n',
  )

  return html.replace(SEO_BLOCK, block)
}

export function buildSitemap(siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, '')
  const urls = SITEMAP_PATHS.map((path) => {
    const canonicalPath = PAGES[path]?.canonicalPath ?? path
    return `    <url><loc>${escapeHtml(`${base}${canonicalPath}`)}</loc></url>`
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}
