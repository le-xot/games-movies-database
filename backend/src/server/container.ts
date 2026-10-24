import { EventEmitter2 } from '@nestjs/event-emitter'
import { RedisClient } from 'bun'
import { DrizzleService } from '@/database/drizzle.service'
import { createJwtAuthenticator } from '@/gateway/jwt-authenticator'
import { AvatarService } from '@/modules/avatar/avatar.service'
import { S3Service } from '@/modules/s3/s3.service'
import { DrizzleUserRepository } from '@/modules/user/repositories/drizzle-user.repository'
import { UserService } from '@/modules/user/user.service'
import { WeatherService } from '@/modules/weather/weather.service'
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
      auth: createJwtAuthenticator({
        secret: env.JWT_SECRET,
        users: {
          // Домен отдаёт Date, HTTP-слой — ISO-строку: в JSON `Date` и так
          // сериализуется в строку, но тип должен это отражать.
          getById: async (id) => {
            const user = await users.getUserById(id)
            if (!user) return null

            return { ...user, createdAt: user.createdAt.toISOString() }
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
