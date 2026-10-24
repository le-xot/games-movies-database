import { ApiError } from '@/gateway/errors'
import type { RateLimitResult } from '@/utils/rate-limit'
import type { RateLimitConfig } from '@/utils/rate-limits'

/**
 * Что гейтвею нужно от лимитера. Реализация на Redis живёт в
 * `utils/rate-limit.ts` и шарится со старым Nest-слоем.
 */
export interface RateLimiter {
  hit(key: string, config: RateLimitConfig): Promise<RateLimitResult>
}

/**
 * Первый хоп `X-Forwarded-For`, как в Nest с `trust proxy = 1`. Без него за
 * Traefik все клиенты получили бы лимит на один IP.
 */
export function clientIp(request: Request, fallback?: string | undefined): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()

  return first || fallback || 'unknown'
}

/**
 * Проверяет лимит и бросает 429 с `Retry-After`. Ключ повторяет формат старого
 * слоя (`rl:<контроллер>.<метод>:<ip>`), чтобы окна не разъезжались при переезде.
 */
export async function enforceRateLimit(
  limiter: RateLimiter,
  options: {
    request: Request
    route: string
    config: RateLimitConfig
    ip?: string | undefined
  },
): Promise<void> {
  const { request, route, config, ip } = options
  const key = `rl:${route}:${clientIp(request, ip)}`
  const { allowed, retryAfterSeconds } = await limiter.hit(key, config)

  if (!allowed) {
    throw new ApiError(429, 'Превышен лимит запросов', {
      'retry-after': String(retryAfterSeconds),
    })
  }
}
