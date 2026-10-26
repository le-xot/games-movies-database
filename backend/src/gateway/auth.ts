import { ApiError } from '@backend/gateway/errors'
import { t } from 'elysia'

/**
 * Схемы пользователя. Имена (`UserEntity`, `UserRole`) и набор полей повторяют
 * то, что генерировал Nest: от них зависит `$ref` в контракте и типы фронта.
 */
const userRoleSchema = t.Union([t.Literal('USER'), t.Literal('ADMIN')])

export const UserEntity = t.Object({
  id: t.String(),
  login: t.String(),
  role: userRoleSchema,
  profileImageUrl: t.String(),
  color: t.String(),
  hasCustomAvatar: t.Boolean(),
  // Косметика: id из каталога `@gmdb/contract`, `null` — без рамки.
  avatarFrameId: t.Nullable(t.String()),
  createdAt: t.String(),
})

export const authModels = { UserRole: userRoleSchema, UserEntity }

/** Пользователь в том виде, в каком его видит HTTP-слой. */
export type GatewayUser = typeof UserEntity.static

/**
 * Что гейтвею нужно от аутентификации. Реализация (JWT + поиск пользователя)
 * живёт снаружи и подставляется в composition root.
 */
export interface Authenticator {
  resolve(token: string): Promise<GatewayUser | null>
}

/** Достаёт значение cookie из заголовка запроса. */
export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined

  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    if (part.slice(0, separator).trim() !== name) continue

    const raw = part.slice(separator + 1).trim()

    // Express-cookie, которым пользовался Nest, при битом percent-encoding
    // отдавал сырое значение. `decodeURIComponent` бросает — и весь роут
    // превращался в 500.
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }

  return undefined
}

/** Резолвит пользователя по cookie `token`, но никогда не бросает. */
export async function resolveUser(
  auth: Authenticator,
  request: Request,
): Promise<GatewayUser | null> {
  const token = readCookie(request.headers.get('cookie'), 'token')
  if (!token) return null

  return await auth.resolve(token)
}

export function requireUser(user: GatewayUser | null): GatewayUser {
  if (!user) throw new ApiError(401, 'Unauthorized')

  return user
}

/** Повторяет RolesGuard: чужую роль отбиваем 403, как это делал Nest. */
export function requireRole(
  user: GatewayUser,
  allowed: readonly GatewayUser['role'][],
): GatewayUser {
  if (!allowed.includes(user.role)) throw new ApiError(403, 'Forbidden')

  return user
}
