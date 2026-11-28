import crypto from 'node:crypto'
import {
  authModels,
  readCookie,
  type Authenticator,
  requireAuthenticated,
} from '@backend/gateway/auth'
import { clearCookie, serializeCookie, type CookieOptions } from '@backend/gateway/cookies'
import { standardErrors, apiErrorModels } from '@backend/gateway/errors'
import { commonModels } from '@backend/gateway/models'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { assertOAuthState } from '@backend/modules/auth/auth.oauth-state'
import {
  TELEGRAM_OIDC_LINKING_COOKIE,
  TELEGRAM_OIDC_STATE_COOKIE,
  TELEGRAM_OIDC_TTL_SECONDS,
  TELEGRAM_OIDC_VERIFIER_COOKIE,
} from '@backend/modules/telegram/telegram.constants'
import { BadRequestError, UnauthorizedError } from '@backend/utils/errors'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

export const oauthModels = {
  CallbackDto: t.Object({
    code: t.String(),
    state: t.String(),
  }),
  // `initData` — подписанная строка из Telegram, по ней и находится аккаунт.
  // Верхняя граница с запасом: реальная строка — это query-string с профилем.
  TelegramWebAppAuthDto: t.Object({
    initData: t.String({ minLength: 1, maxLength: 8192 }),
  }),
}

export interface TelegramProfile {
  id: string
  username?: string | undefined
  firstName: string
  lastName?: string | undefined
  photoUrl?: string | undefined
}

/** Провайдеры: всё, что требует сети и секретов, живёт за этим портом. */
export interface OAuthPort {
  exchangeTwitch(code: string): Promise<string>
  exchangeKick(code: string, codeVerifier: string): Promise<string>
  linkTwitch(userId: string, code: string): Promise<void>
  linkKick(userId: string, code: string, codeVerifier: string): Promise<void>
  createTelegramRequest(): { url: string; state: string; codeVerifier: string }
  exchangeTelegram(code: string, codeVerifier: string): Promise<TelegramProfile>
  loginTelegram(profile: TelegramProfile): Promise<string>
  linkTelegram(userId: string, profile: TelegramProfile): Promise<void>
  /**
   * Проверяет `initData` Telegram Mini App и отдаёт профиль.
   *
   * `null` — подпись, свежесть или формат не сошлись: наружу это уходит как 401
   * без подробностей, чтобы по ответу нельзя было подбирать подпись.
   */
  verifyTelegramWebApp(initData: string): TelegramProfile | null
}

export interface OAuthConfig {
  twitchClientId: string
  twitchCallbackUrl: string
  kickClientId: string
  kickCallbackUrl: string
  telegramCallbackUrl: string
  production: boolean
}

export interface OAuthRouteDeps {
  oauth: OAuthPort
  auth: Authenticator
  rateLimit: RateLimiter
  config: OAuthConfig
}

const OAUTH_COOKIE_TTL_SECONDS = 600
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

export function oauthRoutes({ oauth, auth, rateLimit, config }: OAuthRouteDeps) {
  const cookieOptions = (ttlSeconds: number, httpOnly = true): CookieOptions => ({
    httpOnly,
    sameSite: 'lax',
    secure: config.production,
    path: '/',
    maxAge: ttlSeconds,
  })

  /**
   * Cookie сессии.
   *
   * `crossSite` нужен входу из Mini App: Telegram Web открывает страницу во
   * фрейме с другого домена, и `SameSite=Lax` туда не доедет. `SameSite=None`
   * браузеры принимают только вместе с `Secure`, поэтому флаг включается здесь,
   * а не по `NODE_ENV`.
   */
  const setToken = (
    set: { headers: Record<string, unknown> },
    token: string,
    options: { crossSite?: boolean } = {},
  ) => {
    const cookie = options.crossSite
      ? serializeCookie('token', token, {
          ...cookieOptions(TOKEN_TTL_SECONDS),
          sameSite: 'none',
          secure: true,
        })
      : serializeCookie('token', token, cookieOptions(TOKEN_TTL_SECONDS))

    set.headers['set-cookie'] = [
      ...((set.headers['set-cookie'] as string[] | undefined) ?? []),
      cookie,
    ]
  }

  /**
   * Проверяет state и в любом случае гасит одноразовые cookies: после неудачной
   * попытки они не должны переживать подбор (так было в Nest).
   */
  const verifyState = (
    ctx: { set: { headers: Record<string, unknown> } },
    cookieNames: string[],
    stored: string | undefined,
    received: string | undefined,
  ) => {
    try {
      assertOAuthState(stored, received)
    } finally {
      addCookies(ctx.set, clearCookies(cookieNames))
    }
  }

  const addCookies = (set: { headers: Record<string, unknown> }, cookies: string[]) => {
    set.headers['set-cookie'] = [
      ...((set.headers['set-cookie'] as string[] | undefined) ?? []),
      ...cookies,
    ]
  }

  const limit = rateLimitGuard(rateLimit, RATE_LIMITS.auth)

  const redirect = (url: string) => new Response(null, { status: 302, headers: { location: url } })

  const twitchUrl = (state: string) =>
    'https://id.twitch.tv/oauth2/authorize?' +
    `client_id=${config.twitchClientId}&` +
    `redirect_uri=${config.twitchCallbackUrl}&` +
    'response_type=code&' +
    'scope=user:read:email&' +
    `state=${state}`

  const kickUrl = (state: string, challenge: string) =>
    'https://id.kick.com/oauth/authorize?' +
    `client_id=${config.kickClientId}&` +
    `redirect_uri=${config.kickCallbackUrl}&` +
    'response_type=code&' +
    'scope=user:read&' +
    `code_challenge=${challenge}&` +
    'code_challenge_method=S256&' +
    `state=${state}`

  return (
    new Elysia({ name: 'auth-oauth' })
      .model({ ...apiErrorModels, ...authModels, ...oauthModels, ...commonModels })
      // Хук уровня плагина: в опциях роута Elysia его игнорирует. Nest
      // документирует code/state/error как обязательные, но при отказе
      // пользователя `code` не приходит — подставляем пустые значения.
      .onTransform(({ query }) => {
        const record = query as Record<string, unknown>
        for (const key of ['code', 'state', 'error']) {
          if (record[key] === undefined) record[key] = ''
        }
      })
      .get(
        '/auth/twitch',
        async (ctx) => {
          await limit(ctx)
          const state = crypto.randomBytes(16).toString('hex')
          addCookies(ctx.set, [
            serializeCookie('twitch_state', state, cookieOptions(OAUTH_COOKIE_TTL_SECONDS)),
          ])

          return redirect(twitchUrl(state))
        },
        { response: { 302: t.Void(), ...standardErrors() } },
      )
      .get(
        '/auth/twitch/link',
        async (ctx) => {
          await limit(ctx)
          await requireAuthenticated(auth, ctx.request)
          const state = crypto.randomBytes(16).toString('hex')
          addCookies(ctx.set, [
            serializeCookie('twitch_state', state, cookieOptions(OAUTH_COOKIE_TTL_SECONDS)),
            serializeCookie('twitch_linking', '1', cookieOptions(OAUTH_COOKIE_TTL_SECONDS, false)),
          ])

          return redirect(twitchUrl(state))
        },
        { response: { 302: t.Void(), ...standardErrors() } },
      )
      .post(
        '/auth/twitch/callback',
        async (ctx) => {
          await limit(ctx)
          const body = ctx.body as { code: string; state: string }
          verifyState(
            ctx,
            ['twitch_state', 'twitch_linking'],
            readCookie(ctx.request.headers.get('cookie'), 'twitch_state'),
            body.state,
          )

          const token = await oauth.exchangeTwitch(body.code)
          setToken(ctx.set, token)
          ctx.set.status = 200

          return { success: true }
        },
        {
          body: 'CallbackDto' as const,
          response: { 200: 'SuccessResponseDTO' as const, ...standardErrors() },
        },
      )
      .post(
        '/auth/twitch/link',
        async (ctx) => {
          await limit(ctx)
          const user = await requireAuthenticated(auth, ctx.request)
          const body = ctx.body as { code: string; state: string }
          verifyState(
            ctx,
            ['twitch_state', 'twitch_linking'],
            readCookie(ctx.request.headers.get('cookie'), 'twitch_state'),
            body.state,
          )

          await oauth.linkTwitch(user.id, body.code)
          ctx.set.status = 200

          return { success: true }
        },
        {
          body: 'CallbackDto' as const,
          response: { 200: 'SuccessResponseDTO' as const, ...standardErrors() },
        },
      )
      .get(
        '/auth/kick',
        async (ctx) => {
          await limit(ctx)
          const verifier = crypto.randomBytes(32).toString('base64url')
          const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
          const state = crypto.randomBytes(16).toString('hex')

          addCookies(ctx.set, [
            serializeCookie(
              'kick_code_verifier',
              verifier,
              cookieOptions(OAUTH_COOKIE_TTL_SECONDS),
            ),
            serializeCookie('kick_state', state, cookieOptions(OAUTH_COOKIE_TTL_SECONDS)),
          ])

          return redirect(kickUrl(state, challenge))
        },
        { response: { 302: t.Void(), ...standardErrors() } },
      )
      .get(
        '/auth/kick/link',
        async (ctx) => {
          await limit(ctx)
          await requireAuthenticated(auth, ctx.request)
          const verifier = crypto.randomBytes(32).toString('base64url')
          const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
          const state = crypto.randomBytes(16).toString('hex')

          addCookies(ctx.set, [
            serializeCookie(
              'kick_code_verifier',
              verifier,
              cookieOptions(OAUTH_COOKIE_TTL_SECONDS),
            ),
            serializeCookie('kick_state', state, cookieOptions(OAUTH_COOKIE_TTL_SECONDS)),
            serializeCookie('kick_linking', '1', cookieOptions(OAUTH_COOKIE_TTL_SECONDS, false)),
          ])

          return redirect(kickUrl(state, challenge))
        },
        { response: { 302: t.Void(), ...standardErrors() } },
      )
      .post(
        '/auth/kick/callback',
        async (ctx) => {
          await limit(ctx)
          const body = ctx.body as { code: string; state: string }
          const cookie = ctx.request.headers.get('cookie')
          const verifier = readCookie(cookie, 'kick_code_verifier')

          if (!verifier) throw new BadRequestError('Missing code verifier')
          verifyState(
            ctx,
            ['kick_state', 'kick_code_verifier', 'kick_linking'],
            readCookie(cookie, 'kick_state'),
            body.state,
          )

          const token = await oauth.exchangeKick(body.code, verifier)
          setToken(ctx.set, token)
          ctx.set.status = 200

          return { success: true }
        },
        {
          body: 'CallbackDto' as const,
          response: { 200: 'SuccessResponseDTO' as const, ...standardErrors() },
        },
      )
      .post(
        '/auth/kick/link',
        async (ctx) => {
          await limit(ctx)
          const user = await requireAuthenticated(auth, ctx.request)
          const body = ctx.body as { code: string; state: string }
          const cookie = ctx.request.headers.get('cookie')
          const verifier = readCookie(cookie, 'kick_code_verifier')

          if (!verifier) throw new BadRequestError('Missing code verifier')
          verifyState(
            ctx,
            ['kick_state', 'kick_code_verifier', 'kick_linking'],
            readCookie(cookie, 'kick_state'),
            body.state,
          )

          await oauth.linkKick(user.id, body.code, verifier)
          ctx.set.status = 200

          return { success: true }
        },
        {
          body: 'CallbackDto' as const,
          response: { 200: 'SuccessResponseDTO' as const, ...standardErrors() },
        },
      )
      .get(
        '/auth/telegram',
        async (ctx) => {
          await limit(ctx)
          const request = oauth.createTelegramRequest()
          addCookies(ctx.set, telegramCookies(request.state, request.codeVerifier, cookieOptions))

          return redirect(request.url)
        },
        { response: { 302: t.Void(), ...standardErrors() } },
      )
      .get(
        '/auth/telegram/link',
        async (ctx) => {
          await limit(ctx)
          await requireAuthenticated(auth, ctx.request)
          const request = oauth.createTelegramRequest()
          addCookies(
            ctx.set,
            telegramCookies(request.state, request.codeVerifier, cookieOptions, true),
          )

          return redirect(request.url)
        },
        { response: { 302: t.Void(), ...standardErrors() } },
      )
      .get(
        '/auth/telegram/oidc/callback',
        async (ctx) => {
          await limit(ctx)
          const query = ctx.query as { code: string; state: string; error: string }
          const cookie = ctx.request.headers.get('cookie')
          const storedState = readCookie(cookie, TELEGRAM_OIDC_STATE_COOKIE)
          const verifier = readCookie(cookie, TELEGRAM_OIDC_VERIFIER_COOKIE)
          const isLinking = readCookie(cookie, TELEGRAM_OIDC_LINKING_COOKIE) === '1'
          const mode = isLinking ? 'link' : 'login'

          addCookies(ctx.set, telegramClearCookies())

          try {
            if (query.error) throw new BadRequestError(`Telegram: ${query.error}`)
            if (!storedState || !query.state || query.state !== storedState) {
              throw new BadRequestError('Invalid state')
            }
            if (!query.code || !verifier) throw new BadRequestError('Missing code or verifier')

            const profile = await oauth.exchangeTelegram(query.code, verifier)

            if (isLinking) {
              const user = await requireAuthenticated(auth, ctx.request)
              await oauth.linkTelegram(user.id, profile)

              return redirect(`${config.telegramCallbackUrl}?mode=link`)
            }

            const token = await oauth.loginTelegram(profile)
            setToken(ctx.set, token)

            return redirect(`${config.telegramCallbackUrl}?mode=login`)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Telegram authorization failed'
            const params = new URLSearchParams({ mode, error: message })

            return redirect(`${config.telegramCallbackUrl}?${params.toString()}`)
          }
        },
        {
          query: t.Object({
            code: t.String(),
            state: t.String(),
            error: t.String(),
          }),
          response: { 302: t.Void(), ...standardErrors() },
        },
      )
      // Вход из Telegram Mini App: браузерной навигации нет, `initData` приходит
      // подписанной строкой. Токен ставим той же cookie, что и OIDC-вход, —
      // дальше SPA живёт как обычно и не знает, откуда пришла сессия.
      .post(
        '/auth/telegram/webapp',
        async (ctx) => {
          await limit(ctx, RATE_LIMITS.telegramWebApp)

          const profile = oauth.verifyTelegramWebApp((ctx.body as { initData: string }).initData)
          if (!profile) throw new UnauthorizedError('Не удалось подтвердить вход через Telegram')

          const token = await oauth.loginTelegram(profile)
          // Telegram Web встраивает Mini App во фрейм чужого домена — cookie
          // должна быть кросс-сайтовой, иначе следующий /me придёт гостем.
          setToken(ctx.set, token, { crossSite: true })

          return { success: true as const }
        },
        {
          body: 'TelegramWebAppAuthDto' as const,
          response: { 200: 'SuccessResponseDTO' as const, ...standardErrors() },
        },
      )
  )
}

/** Гасим одноразовые cookies после успешного обмена — как это делал Nest. */
function clearCookies(names: string[]): string[] {
  return names.map(clearCookie)
}

function telegramCookies(
  state: string,
  codeVerifier: string,
  options: (ttl: number, httpOnly?: boolean) => CookieOptions,
  linking = false,
): string[] {
  const ttl = TELEGRAM_OIDC_TTL_SECONDS
  const cookies = [
    serializeCookie(TELEGRAM_OIDC_STATE_COOKIE, state, options(ttl)),
    serializeCookie(TELEGRAM_OIDC_VERIFIER_COOKIE, codeVerifier, options(ttl)),
  ]

  if (linking) cookies.push(serializeCookie(TELEGRAM_OIDC_LINKING_COOKIE, '1', options(ttl, false)))

  return cookies
}

function telegramClearCookies(): string[] {
  return [
    TELEGRAM_OIDC_STATE_COOKIE,
    TELEGRAM_OIDC_VERIFIER_COOKIE,
    TELEGRAM_OIDC_LINKING_COOKIE,
  ].map(clearCookie)
}
