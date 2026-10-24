import type { GatewayUser } from '@/gateway/auth'
import type { Like } from '@/gateway/likes'
import type { LikeEntity } from '@/modules/like/like.entity'
import type { UserEntity } from '@/modules/user/user.entity'

/**
 * Мост между доменом и HTTP. Домен работает с `Date`, наружу уходит ISO-строка:
 * JSON и так сериализует `Date` в строку, но тип должен это отражать.
 *
 * Когда доменные сущности перестанут быть Nest-классами, адаптеры схлопнутся.
 */
export function toGatewayUser(user: UserEntity): GatewayUser {
  return { ...user, createdAt: user.createdAt.toISOString() }
}

export function toGatewayLike(like: LikeEntity): Like {
  const user =
    like.user === null ? { user: null } : like.user ? { user: toGatewayUser(like.user) } : {}

  return {
    id: like.id,
    userId: like.userId,
    recordId: like.recordId,
    createdAt: like.createdAt.toISOString(),
    ...user,
  }
}
