import { describe, expect, it } from 'bun:test'
import { createContainer } from '@/server/container'

describe('createContainer', () => {
  it('wires real services without a Nest DI container', async () => {
    const container = createContainer()

    try {
      // Мусорный токен не должен ни бросать, ни находить пользователя.
      expect(await container.deps.auth.resolve('not-a-jwt')).toBeNull()
      expect(typeof container.deps.weather.getWeatherData).toBe('function')
      expect(typeof container.deps.rateLimit.hit).toBe('function')
    } finally {
      await container.close()
    }
  })
})
