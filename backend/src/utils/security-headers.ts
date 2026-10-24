import { env } from '@backend/utils/enviroments'

/** Минимум от Express-совместимых объектов: гейтвей их не использует. */
interface Response {
  setHeader(name: string, value: string): void
}
interface NextFunction {
  (): void
}

const CSP = [
  "default-src 'self'",
  // Хеш инлайнового скрипта из frontend/index.html: бренд заставки и preload баннера.
  // Пересобирается автоматически — расхождение ловит security-headers.spec.ts.
  "script-src 'self' 'sha256-2UZi9RGYgupkvgMxCHzg3LZNkfUyWYtD3VUVo//64eM='",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

/**
 * Заголовки безопасности одним словарём: их ставит и Express-мидлварь старого
 * слоя, и Elysia-гейтвей. CSP отдаётся только в проде — на dev-сервере Vite его
 * ломает HMR.
 */
export function buildSecurityHeaders(isProduction: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }

  if (isProduction) {
    headers['Content-Security-Policy'] = CSP
  }

  return headers
}

export function securityHeaders(
  _req: unknown,
  res: Response,
  next: NextFunction,
  isProduction = env.NODE_ENV === 'production',
): void {
  const headers = buildSecurityHeaders(isProduction)

  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value)
  }

  next()
}
