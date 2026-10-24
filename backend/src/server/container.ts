import { EventEmitter2 } from '@nestjs/event-emitter'
import { RedisClient } from 'bun'
import { DrizzleService } from '@/database/drizzle.service'
import { createJwtAuthenticator } from '@/gateway/jwt-authenticator'
import { AvatarService } from '@/modules/avatar/avatar.service'
import { LikeService } from '@/modules/like/like.service'
import { DrizzleLikeRepository } from '@/modules/like/repositories/drizzle-like.repository'
import { QueueService } from '@/modules/queue/queue.service'
import { DrizzleQueueRepository } from '@/modules/queue/repositories/drizzle-queue.repository'
import { S3Service } from '@/modules/s3/s3.service'
import { DrizzleStatsRepository } from '@/modules/stats/repositories/drizzle-stats.repository'
import { StatsService } from '@/modules/stats/stats.service'
import { DrizzleUserRepository } from '@/modules/user/repositories/drizzle-user.repository'
import { UserService } from '@/modules/user/user.service'
import { WeatherService } from '@/modules/weather/weather.service'
import { toGatewayLike, toGatewayUser } from '@/server/adapters'
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

  const users = new UserService(
    new DrizzleUserRepository(drizzle),
    events,
    new AvatarService(new S3Service()),
  )
  const likes = new LikeService(new DrizzleLikeRepository(drizzle), events)
  const stats = new StatsService(new DrizzleStatsRepository(drizzle))
  const queue = new QueueService(new DrizzleQueueRepository(drizzle))
  const weather = new WeatherService()

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
