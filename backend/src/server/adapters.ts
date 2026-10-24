import type { GatewayUser } from '@backend/gateway/auth'
import type { Like } from '@backend/gateway/likes'
import type { Rating, RatedRecord } from '@backend/gateway/ratings'
import type { GatewayRecord } from '@backend/gateway/records'
import type { UserAccount } from '@backend/gateway/users'
import type { LikeEntity } from '@backend/modules/like/like.entity'
import type { RatingEntity, UserRatedRecordEntity } from '@backend/modules/rating/rating.entity'
import type { RecordEntity, SuggestionOwnershipEntity } from '@backend/modules/record/record.entity'
import type { UserEntity } from '@backend/modules/user/user.entity'
import type { AccountPlatform } from '@gmdb/contract'

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

function toGatewayOwnership(ownership: SuggestionOwnershipEntity): Record<string, unknown> {
  return {
    ...ownership,
    createdAt: ownership.createdAt.toISOString(),
    ...(ownership.user ? { user: toGatewayUser(ownership.user) } : {}),
  }
}

export function toGatewayRecord(record: RecordEntity): GatewayRecord {
  return {
    id: record.id,
    title: record.title,
    link: record.link,
    posterUrl: record.posterUrl,
    status: record.status,
    type: record.type,
    genre: record.genre,
    grade: record.grade,
    episode: record.episode,
    createdAt: record.createdAt.toISOString(),
    ...(record.friendsCounts !== undefined
      ? { friendsCounts: record.friendsCounts as Record<string, never> | null }
      : {}),
    ...(record.friendsTotal !== undefined ? { friendsTotal: record.friendsTotal } : {}),
    ...(record.friendsTop !== undefined ? { friendsTop: record.friendsTop } : {}),
    ...(record.myGrade !== undefined ? { myGrade: record.myGrade } : {}),
    ...(record.extra !== undefined ? { extra: record.extra as Record<string, never> | null } : {}),
    ...(record.likes !== undefined ? { likes: record.likes?.map(toGatewayLike) ?? null } : {}),
    ...(record.suggestionOwnership !== undefined
      ? {
          suggestionOwnership: record.suggestionOwnership
            ? (toGatewayOwnership(record.suggestionOwnership) as NonNullable<
                GatewayRecord['suggestionOwnership']
              >)
            : null,
        }
      : {}),
  }
}

export function toGatewayRatedRecord(record: UserRatedRecordEntity): RatedRecord {
  return {
    ...toGatewayRecord(record),
    userGrade: record.userGrade,
    userLogin: record.userLogin,
  }
}

export function toGatewayRating(rating: RatingEntity): Rating {
  return {
    id: rating.id,
    userId: rating.userId,
    recordId: rating.recordId,
    grade: rating.grade,
    createdAt: rating.createdAt.toISOString(),
    updatedAt: rating.updatedAt.toISOString(),
    ...(rating.user !== undefined ? { user: rating.user ? toGatewayUser(rating.user) : null } : {}),
  }
}

export function toGatewayAccount(account: {
  id: number
  userId: string
  platform: AccountPlatform
  platformUserId: string
  platformLogin: string
  platformAvatar: string | null
  createdAt: Date
}): UserAccount {
  return { ...account, createdAt: account.createdAt.toISOString() }
}
