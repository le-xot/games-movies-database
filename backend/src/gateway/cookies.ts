export interface CookieOptions {
  httpOnly?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
  path?: string
  maxAge?: number
}

function attributeName(value: string): string {
  return value
    .toLowerCase()
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-')
}

/**
 * Собирает `Set-Cookie` вручную: Elysia не несёт cookie-парсер, а тащить
 * Express-мидлварь ради двух флагов — лишнее.
 *
 * Формат совпадает с тем, что ставил `cookie-parser` в Nest: `Path`, `Max-Age`,
 * `HttpOnly`, `Secure`, `SameSite`.
 */
export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]

  if (options.path) parts.push(`Path=${options.path}`)
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`)
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  if (options.sameSite) parts.push(`SameSite=${attributeName(options.sameSite)}`)

  return parts.join('; ')
}

/** Удаление cookie: пустое значение и нулевой срок жизни. */
export function clearCookie(name: string): string {
  return `${name}=; Path=/; Max-Age=0`
}
