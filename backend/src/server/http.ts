import { Elysia } from 'elysia'
import { createStaticHandler } from '@/server/static'
import { isOriginAllowed } from '@/utils/cors-origins'
import { buildSecurityHeaders } from '@/utils/security-headers'
import type { Gateway } from '@/gateway'

export interface HttpOptions {
  corsOrigins: string[]
  production?: boolean
  /** Каталог собранного фронта. Без него статика не раздаётся (тесты, dev). */
  staticRoot?: string | undefined
}

const PREFLIGHT_MAX_AGE_SECONDS = 600

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
    .use(new Elysia({ prefix: '/api' }).use(gateway))

  if (!staticRoot) return app

  const serveStatic = createStaticHandler(staticRoot)

  return app.get('/*', ({ request }) => serveStatic(request))
}
