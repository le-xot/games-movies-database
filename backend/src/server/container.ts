import { EventEmitter2 } from '@nestjs/event-emitter'
import { RedisClient } from 'bun'
import { DrizzleService } from '@/database/drizzle.service'
import { createJwtAuthenticator } from '@/gateway/jwt-authenticator'
import { AvatarService } from '@/modules/avatar/avatar.service'
import { ImgService } from '@/modules/img/img.service'
import { LikeService } from '@/modules/like/like.service'
import { DrizzleLikeRepository } from '@/modules/like/repositories/drizzle-like.repository'
import { QueueService } from '@/modules/queue/queue.service'
import { DrizzleQueueRepository } from '@/modules/queue/repositories/drizzle-queue.repository'
import { RatingService } from '@/modules/rating/rating.service'
import { DrizzleRatingRepository } from '@/modules/rating/repositories/drizzle-rating.repository'
import { RecordService } from '@/modules/record/record.service'
import { DrizzleRecordRepository } from '@/modules/record/repositories/drizzle-record.repository'
import { RecordsProvidersService } from '@/modules/records-providers/records-providers.service'
import { DrizzleRecordsProvidersRepository } from '@/modules/records-providers/repositories/drizzle-records-providers.repository'
import { S3Service } from '@/modules/s3/s3.service'
import { DrizzleStatsRepository } from '@/modules/stats/repositories/drizzle-stats.repository'
import { StatsService } from '@/modules/stats/stats.service'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { DrizzleUserRepository } from '@/modules/user/repositories/drizzle-user.repository'
import { UserService } from '@/modules/user/user.service'
import { WeatherService } from '@/modules/weather/weather.service'
import {
  toGatewayLike,
  toGatewayRatedRecord,
  toGatewayRating,
  toGatewayRecord,
  toGatewayUser,
} from '@/server/adapters'
import { env } from '@/utils/enviroments'
import { hitRateLimit } from '@/utils/rate-limit'
import type { GatewayDeps } from '@/gateway'
import type { RateLimiter } from '@/gateway/rate-limit'

export interface Container {
  deps: GatewayDeps
  close(): Promise<void>
}

/**
 * Composition root гейтвея: зависимости собираются руками, явно и в одном месте.
 *
 * Доменные сервисы пока помечены `@Injectable()` и пользуются Nest-логгером, но
 * это обычные классы — DI им не нужен, декораторы не мешают `new`. Поэтому
 * гейтвей может подняться, пока Nest ещё жив.
 */
export function createContainer(): Container {
  const drizzle = new DrizzleService()
  const events = new EventEmitter2()
  const s3 = new S3Service()

  const users = new UserService(new DrizzleUserRepository(drizzle), events, new AvatarService(s3))
  const likes = new LikeService(new DrizzleLikeRepository(drizzle), events)
  const stats = new StatsService(new DrizzleStatsRepository(drizzle))
  const queue = new QueueService(new DrizzleQueueRepository(drizzle))
  const weather = new WeatherService()

  const ratingRepository = new DrizzleRatingRepository(drizzle)
  const ratings = new RatingService(ratingRepository, drizzle, events)

  const records = new RecordService(
    new DrizzleRecordRepository(drizzle),
    new RecordsProvidersService(
      new DrizzleRecordsProvidersRepository(drizzle),
      new TwitchService(),
    ),
    events,
    new ImgService(s3),
    ratingRepository,
  )

  const redis = new RedisClient(env.REDIS_URL)
  const rateLimit: RateLimiter = {
    hit: (key, config) =>
      hitRateLimit(redis, key, config, (error) => {
        console.warn(`[gateway] Redis недоступен, лимит пропущен: ${String(error)}`)
      }),
  }

  return {
    deps: {
      weather,
      stats,
      queue,
      records: {
        createFromLink: async (data) =>
          toGatewayRecord(
            await records.createRecordFromLink({
              link: data.link,
              ...(data.status ? { status: data.status } : {}),
              ...(data.type ? { type: data.type } : {}),
            }),
          ),
        findById: async (id, viewerId) =>
          toGatewayRecord(await records.findRecordById(id, viewerId)),
        patch: async (id, data) =>
          toGatewayRecord(
            await records.patchRecord(id, {
              ...(data.status ? { status: data.status } : {}),
              ...(data.grade !== undefined ? { grade: data.grade } : {}),
              ...(data.episode !== undefined ? { episode: data.episode } : {}),
              ...(data.type ? { type: data.type } : {}),
            }),
          ),
        updatePoster: async (id, url) => toGatewayRecord(await records.updatePoster(id, url)),
        remove: (id) => records.deleteRecord(id),
        getAll: async (query) => {
          const { page, limit, orderBy, direction, viewerId, ...rest } = query
          const filters = {
            ...(rest.search !== undefined ? { search: rest.search } : {}),
            ...(rest.status !== undefined ? { status: rest.status } : {}),
            ...(rest.type !== undefined ? { type: rest.type } : {}),
            ...(rest.grade !== undefined ? { grade: rest.grade } : {}),
            ...(rest.genre !== undefined ? { genre: rest.genre } : {}),
          }

          const result = await records.getAllRecords(
            page,
            limit,
            filters,
            orderBy,
            direction,
            viewerId,
          )

          return { records: result.records.map(toGatewayRecord), total: result.total }
        },
      },
      ratings: {
        rate: async (userId, recordId, grade) =>
          toGatewayRating(await ratings.rate(userId, recordId, grade)),
        unrate: (userId, recordId) => ratings.unrate(userId, recordId),
        getMy: async (userId, query) => {
          const { items, total } = await ratings.getUserRatings(
            userId,
            userId,
            query.page,
            query.limit,
            query.grade,
          )

          return { items: items.map(toGatewayRatedRecord), total }
        },
        getUser: async (viewerId, userId, query) => {
          const { items, total } = await ratings.getUserRatings(
            viewerId,
            userId,
            query.page,
            query.limit,
            query.grade,
          )

          return { items: items.map(toGatewayRatedRecord), total }
        },
        getFriends: async () => ({ members: await ratings.getFriends() }),
      },
      likes: {
        createLike: async (userId, recordId) =>
          toGatewayLike(await likes.createLike(userId, recordId)),
        deleteLike: (userId, recordId) => likes.deleteLike(userId, recordId),
        getLikesByRecordId: (recordId) => likes.getLikesByRecordId(recordId),
        getLikesByUserId: (userId) => likes.getLikesByUserId(userId),
        getLikes: (page, limit) => likes.getLikes(page, limit),
      },
      auth: createJwtAuthenticator({
        secret: env.JWT_SECRET,
        users: {
          getById: async (id) => {
            const user = await users.getUserById(id)

            return user ? toGatewayUser(user) : null
          },
        },
      }),
      rateLimit,
    },
    async close() {
      await drizzle.pool.end()
      redis.close()
    },
  }
}
