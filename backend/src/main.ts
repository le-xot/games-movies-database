import { resolve } from 'node:path'
import process from 'node:process'
import { createGateway } from '@/gateway'
import { bridgeWsEvents } from '@/gateway/ws'
import { createContainer } from '@/server/container'
import { createHttpServer } from '@/server/http'
import { parseCorsOrigins } from '@/utils/cors-origins'
import { env } from '@/utils/enviroments'

/**
 * Точка входа нового слоя. Пока живёт параллельно Nest и слушает свой порт:
 * переехавшие роуты можно потыкать вживую, не трогая прод.
 *
 * Запуск: `bun run dev:gateway` (порт `GATEWAY_PORT`, по умолчанию 3001).
 */
const container = createContainer()

const app = createHttpServer(createGateway(container.deps), {
  corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
  production: env.NODE_ENV === 'production',
  staticRoot: resolve(import.meta.dir, '../../../frontend/dist'),
})

const port = Number(process.env['GATEWAY_PORT'] ?? env.APP_PORT)

await container.init()

app.listen({ port, hostname: '0.0.0.0' }, () => {
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
