import { normalize, resolve, sep } from 'node:path'
import { setAssetCacheHeaders } from '@backend/utils/static-cache-headers'

const HTML_CONTENT_TYPE = 'text/html; charset=utf-8'

const CONTENT_TYPES: Record<string, string> = {
  html: HTML_CONTENT_TYPE,
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  txt: 'text/plain; charset=utf-8',
}

const INDEX_CACHE_CONTROL = 'no-cache'

function contentTypeFor(path: string): string {
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase()

  return CONTENT_TYPES[extension] ?? 'application/octet-stream'
}

/**
 * Отдаёт собранный фронт из `root` с SPA-фолбэком на `index.html`.
 *
 * Путь нормализуется и проверяется на выход за пределы `root`: без этого
 * `/%2e%2e/%2e%2e/etc/passwd` уехал бы наружу.
 */
export function createStaticHandler(root: string) {
  const rootWithSeparator = resolve(root) + sep

  return async function serveStatic(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const requested = decodeURIComponent(url.pathname)

    const candidate = resolve(root, `.${normalize(requested)}`)
    const insideRoot = candidate === resolve(root) || candidate.startsWith(rootWithSeparator)
    const file = Bun.file(insideRoot ? candidate : resolve(root, 'index.html'))

    if (insideRoot && (await file.exists()) && candidate !== resolve(root)) {
      const headers = new Headers({ 'content-type': contentTypeFor(candidate) })
      setAssetCacheHeaders({ setHeader: (name, value) => headers.set(name, value) }, candidate)

      return new Response(file, { headers })
    }

    const index = Bun.file(resolve(root, 'index.html'))
    if (!(await index.exists())) {
      return new Response('Not Found', { status: 404 })
    }

    return new Response(index, {
      headers: {
        'content-type': HTML_CONTENT_TYPE,
        'cache-control': INDEX_CACHE_CONTROL,
      },
    })
  }
}
