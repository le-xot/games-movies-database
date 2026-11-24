const INLINE_BOOT_SCRIPT_HASH = "'sha256-2UZi9RGYgupkvgMxCHzg3LZNkfUyWYtD3VUVo//64eM='"

/**
 * Собирает CSP.
 *
 * `telegramMiniApp` — для страницы Mini App: её Telegram Web открывает во
 * фрейме, поэтому `frame-ancestors` должен пускать Telegram, а SDK грузится с
 * `telegram.org`. Для остального сайта рамка запрещена совсем.
 */
function buildCsp(telegramMiniApp: boolean): string {
  const scriptSrc = [
    "'self'",
    INLINE_BOOT_SCRIPT_HASH,
    ...(telegramMiniApp ? ['https://telegram.org'] : []),
  ].join(' ')

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    telegramMiniApp
      ? "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org"
      : "frame-ancestors 'none'",
  ].join('; ')
}

export interface SecurityHeaderOptions {
  /**
   * Страница Telegram Mini App.
   *
   * Telegram Web встраивает её в `<iframe>`, поэтому запрет на фреймы снимается
   * выборочно: `X-Frame-Options` не ставим, а `frame-ancestors` перечисляет
   * только Telegram. Остальной сайт остаётся с `DENY`.
   */
  telegramMiniApp?: boolean
}

/**
 * Заголовки безопасности одним словарём: их ставит `server/http.ts` на входе.
 * CSP отдаётся только в проде — на dev-сервере Vite его ломает HMR.
 */
export function buildSecurityHeaders(
  isProduction: boolean,
  options: SecurityHeaderOptions = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }

  // Заголовок ставится точечно: у Mini App на его месте — разрешение для Telegram.
  if (!options.telegramMiniApp) headers['X-Frame-Options'] = 'DENY'

  if (isProduction) {
    headers['Content-Security-Policy'] = buildCsp(options.telegramMiniApp === true)
  }

  return headers
}
