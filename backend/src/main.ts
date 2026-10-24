import { resolve } from 'node:path'
import process from 'node:process'
import { createGateway } from '@backend/gateway'
import { bridgeWsEvents } from '@backend/gateway/ws'
import { createContainer } from '@backend/server/container'
import { createHttpServer } from '@backend/server/http'
import { parseCorsOrigins } from '@backend/utils/cors-origins'
import { env } from '@backend/utils/enviroments'

/**
 * Продовая точка входа: HTTP-обвязка вокруг Elysia-гейтвея, раздача собранного
 * фронта и мост доменных событий в нативный WebSocket.
 *
 * Запуск: `bun run start` (порт `APP_PORT`).
 */

/** Больше 8 МиБ не принимаем: аватар ограничен 5 МиБ, остальные тела мелкие. */
const MAX_REQUEST_BODY_BYTES = 8 * 1024 * 1024
const container = createContainer()

const app = createHttpServer(createGateway(container.deps), {
  corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
  production: env.NODE_ENV === 'production',
  staticRoot: resolve(import.meta.dir, '../../frontend/dist'),
})

const port = env.APP_PORT

await container.init()

app.listen({ port, hostname: '0.0.0.0', maxRequestBodySize: MAX_REQUEST_BODY_BYTES }, () => {
  bridgeWsEvents({
    emitter: container.emitter,
    publisher: () => app.server ?? undefined,
  })

  console.log(`🌿 Gateway слушает http://localhost:${port}/api`)
  console.log(`   WebSocket: ws://localhost:${port}/ws`)
})

async function shutdown(signal: string) {
  console.log(`Gateway: получен ${signal}, закрываюсь`)
  await app.stop()
  await container.close()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
