import { errorBody } from '@backend/gateway/errors'
import { wsRoutes } from '@backend/gateway/ws'
import { createStaticHandler } from '@backend/server/static'
import { isOriginAllowed } from '@backend/utils/cors-origins'
import { buildSecurityHeaders } from '@backend/utils/security-headers'
import { Elysia } from 'elysia'
import type { Gateway } from '@backend/gateway'

export interface HttpOptions {
  corsOrigins: string[]
  production?: boolean
  /** Каталог собранного фронта. Без него статика не раздаётся (тесты, dev). */
  staticRoot?: string | undefined
}

const PREFLIGHT_MAX_AGE_SECONDS = 600

/** Префикс API: под ним SPA-фолбэк и текстовые 404 недопустимы. */
const API_PREFIX = '/api'

function isApiPath(pathname: string): boolean {
  return pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`)
}

function apiNotFound(): Response {
  return new Response(JSON.stringify(errorBody(404, 'Not Found')), {
    status: 404,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

/**
 * HTTP-обвязка вокруг гейтвея: префикс `/api`, заголовки безопасности, CORS и
 * раздача собранного фронта.
 *
 * CORS сделан руками, а не плагином: правила должны совпадать с Nest-слоем
 * (`credentials: true`, только перечисленные origin'ы, первый хоп прокси).
 */
export function createHttpServer(gateway: Gateway, options: HttpOptions) {
  const { corsOrigins, production = false, staticRoot } = options
  const security = buildSecurityHeaders(production)

  const app = new Elysia()
    .onRequest(({ request, set }) => {
      set.headers = { ...security }

      const origin = request.headers.get('origin') ?? undefined
      if (!origin || !isOriginAllowed(origin, corsOrigins)) return

      set.headers['access-control-allow-origin'] = origin
      set.headers['access-control-allow-credentials'] = 'true'
      set.headers['vary'] = 'Origin'
    })
    .options('*', ({ request, set }) => {
      const origin = request.headers.get('origin') ?? undefined
      if (origin && isOriginAllowed(origin, corsOrigins)) {
        set.headers['access-control-allow-origin'] = origin
        set.headers['access-control-allow-credentials'] = 'true'
        set.headers['access-control-allow-methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
        set.headers['access-control-allow-headers'] =
          request.headers.get('access-control-request-headers') ?? 'content-type'
        set.headers['access-control-max-age'] = String(PREFLIGHT_MAX_AGE_SECONDS)
      }

      set.status = 204
      return null
    })
    .use(wsRoutes({ corsOrigins }))
    .use(new Elysia({ prefix: '/api' }).use(gateway))
    // Неизвестный метод/путь под `/api` не должен уходить в статику и не должен
    // отдавать plain-text: контракт обещает `ApiErrorDto`.
    .onError(({ code, request, set }) => {
      if (code !== 'NOT_FOUND') return
      if (!isApiPath(new URL(request.url).pathname)) return

      set.status = 404
      set.headers['content-type'] = 'application/json; charset=utf-8'

      return errorBody(404, 'Not Found')
    })

  if (!staticRoot) return app

  const serveStatic = createStaticHandler(staticRoot)

  return app.get('/*', ({ request }) =>
    isApiPath(new URL(request.url).pathname) ? apiNotFound() : serveStatic(request),
  )
}
