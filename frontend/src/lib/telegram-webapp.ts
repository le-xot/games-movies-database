/**
 * Telegram Mini App: загрузка SDK и вход по `initData`.
 *
 * Страница `/tg/wordle` открывается внутри Telegram, поэтому у неё нет ни
 * редиректа на OAuth, ни сессии в cookie до первого запроса. Схема такая:
 * Telegram кладёт подписанные данные в адрес (хэш `#tgWebAppData`), SDK отдаёт
 * их же в `initData`; строку меняем на обычную cookie `token`, и дальше SPA
 * работает как после любого другого входа.
 */

export const TELEGRAM_MINI_APP_PATH = '/tg/wordle'

/** Поле, в котором Telegram передаёт данные Mini App в хэше адреса. */
export const TELEGRAM_WEBAPP_HASH_FIELD = 'tgWebAppData'

export const TELEGRAM_AUTH_PATH = '/api/auth/telegram/webapp'

const TELEGRAM_SDK_URL = 'https://telegram.org/js/telegram-web-app.js'
const SDK_TIMEOUT_MS = 5000

/** Предел на обмен initData: страница не должна висеть на заставке из-за сети. */
const AUTH_TIMEOUT_MS = 5000

/**
 * Минимальная часть `Telegram.WebApp`, которой мы пользуемся.
 *
 * Полный API тянет за собой пакет типов на сотни строк, а нужны три вызова и
 * одна строка данных.
 */
export interface TelegramWebAppApi {
  initData: string
  ready?: () => void
  expand?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  disableVerticalSwipes?: () => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebAppApi }
  }
}

export interface TelegramMiniAppBoot {
  /** Открыта ли страница как Mini App (а не просто по прямому адресу). */
  isMiniApp: boolean
  /** Получилось ли обменять `initData` на сессию. */
  authenticated: boolean
}

let sdkPromise: Promise<boolean> | null = null

/** `/tg/wordle` — единственный адрес, которому нужен вход через Telegram. */
export function isTelegramMiniAppPath(pathname: string): boolean {
  return pathname === TELEGRAM_MINI_APP_PATH || pathname.startsWith(`${TELEGRAM_MINI_APP_PATH}/`)
}

/**
 * Достаёт `initData` из хэша адреса.
 *
 * Нужен как запасной путь: если SDK не загрузился (сеть, блокировщик), данные
 * в хэше всё равно есть, и вход можно продолжить.
 */
export function readInitDataFromHash(hash: string): string | null {
  if (hash.length === 0) return null

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const initData = params.get(TELEGRAM_WEBAPP_HASH_FIELD)

  return initData && initData.length > 0 ? initData : null
}

/** Загружает SDK один раз за жизнь страницы. */
export function loadTelegramSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Telegram?.WebApp) return Promise.resolve(true)
  if (!sdkPromise) sdkPromise = injectSdkScript()

  return sdkPromise
}

function injectSdkScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    let settled = false

    const finish = (loaded: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(loaded)
    }

    const timer = setTimeout(() => finish(Boolean(window.Telegram?.WebApp)), SDK_TIMEOUT_MS)

    script.src = TELEGRAM_SDK_URL
    script.async = true
    script.onload = () => finish(true)
    script.onerror = () => finish(false)

    document.head.appendChild(script)
  })
}

/** `initData` из SDK, а если SDK не поднялся — из хэша адреса. */
export function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null

  const fromSdk = window.Telegram?.WebApp?.initData
  if (fromSdk && fromSdk.length > 0) return fromSdk

  return readInitDataFromHash(window.location.hash)
}

/** Есть ли вообще признаки запуска внутри Telegram. */
export function isTelegramEnvironment(): boolean {
  return getTelegramInitData() !== null
}

/**
 * Обменивает `initData` на сессию (`httpOnly`-cookie `token`).
 *
 * Cookie ставит сервер после проверки подписи, поэтому чужие данные ничего не
 * дают: 401 — и страница остаётся гостем.
 */
export async function authenticateTelegramMiniApp(initData: string): Promise<boolean> {
  try {
    const response = await fetch(TELEGRAM_AUTH_PATH, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData }),
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    })

    return response.ok
  } catch {
    return false
  }
}

/**
 * Готовит окно к показу и входит.
 *
 * Вызывается из `main.ts` до первого запроса `/me`: иначе страница успела бы
 * отрисоваться гостем и показала бы «Открой из Telegram» игроку, который уже
 * внутри.
 */
export async function prepareTelegramMiniApp(): Promise<TelegramMiniAppBoot> {
  if (typeof window === 'undefined') return { isMiniApp: false, authenticated: false }
  if (!isTelegramMiniAppPath(window.location.pathname)) {
    return { isMiniApp: false, authenticated: false }
  }

  await loadTelegramSdk()
  applyTelegramChrome()

  const initData = getTelegramInitData()
  if (!initData) return { isMiniApp: true, authenticated: false }

  return { isMiniApp: true, authenticated: await authenticateTelegramMiniApp(initData) }
}

/**
 * Растягивает окно на весь экран и красит шапку Telegram под фон игры.
 *
 * Цвет — тёмный фон сайта (`oklch(0.145 0 0)` ≈ #0a0a0a). Тему Telegram не
 * используем сознательно: сайт тёмный, а светлая шапка над тёмной доской
 * выглядела бы как чужая рамка.
 */
function applyTelegramChrome(): void {
  const app = window.Telegram?.WebApp
  if (!app) return

  app.ready?.()
  app.expand?.()
  app.disableVerticalSwipes?.()
  app.setHeaderColor?.('#0a0a0a')
  app.setBackgroundColor?.('#0a0a0a')
}
