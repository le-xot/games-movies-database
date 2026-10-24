import { afterEach, describe, expect, it } from 'bun:test'
import { createTestGateway } from '@/__tests__/helpers/gateway-stub'
import { WS_PATH, WS_TOPIC } from '@/gateway/ws'
import { createHttpServer } from '@/server/http'

const servers: Array<{ stop: () => Promise<void> }> = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.stop()))
})

async function startServer(corsOrigins: string[] = []) {
  const app = createHttpServer(createTestGateway(), { corsOrigins, production: false })
  const server = await app.listen({ port: 0, hostname: '127.0.0.1' })

  servers.push({
    stop: async () => {
      // force: апгрейженное соединение держит сервер открытым.
      await server.stop(true)
    },
  })

  return { app, port: server.server!.port }
}

function nextMessage(socket: WebSocket, timeoutMs = 2000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('сообщение не пришло')), timeoutMs)

    socket.addEventListener(
      'message',
      (event) => {
        clearTimeout(timer)
        resolve(String(event.data))
      },
      { once: true },
    )
  })
}

function opened(socket: WebSocket, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('сокет не открылся')), timeoutMs)

    socket.addEventListener(
      'open',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

describe('native websocket', () => {
  it('delivers a frame published to the ws topic', async () => {
    const { app, port } = await startServer()
    const socket = new WebSocket(`ws://127.0.0.1:${port}${WS_PATH}`)

    try {
      await opened(socket)
      const message = nextMessage(socket)

      app.server?.publish(WS_TOPIC, JSON.stringify({ event: 'update-likes', payload: { id: 1 } }))

      expect(JSON.parse(await message)).toEqual({
        event: 'update-likes',
        payload: { id: 1 },
      })
    } finally {
      socket.close()
    }
  })

  it('lets an allowed origin upgrade and rejects a foreign one', async () => {
    const { port } = await startServer(['https://le-xot.dev'])

    const upgrade = (origin: string) =>
      fetch(`http://127.0.0.1:${port}${WS_PATH}`, {
        headers: {
          origin,
          upgrade: 'websocket',
          connection: 'upgrade',
          'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'sec-websocket-version': '13',
        },
      })

    const allowed = await upgrade('https://le-xot.dev')
    const foreign = await upgrade('https://evil.example')

    expect(allowed.status).toBe(101)
    expect(foreign.status).toBe(403)
  })
})
