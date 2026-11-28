import { describe, expect, it, mock } from 'bun:test'
import { RECORDS_QUERY_KEYS } from '@/composables/query-keys'
import { COALESCER_KEYS } from '@/composables/websocket-resync'
import { buildWsHandlers } from '@/composables/ws-handlers'
import { RecordGenre } from '@/lib/api'

function build() {
  const invalidate = mock((_key: string[]) => {})
  const refetchUser = mock(() => {})
  const handlers = buildWsHandlers({ invalidate, refetchUser })

  return { handlers, invalidate, refetchUser }
}

describe('buildWsHandlers', () => {
  it('покрывает каждый ключ из COALESCER_KEYS', () => {
    const { handlers } = build()

    for (const key of COALESCER_KEYS) {
      expect(typeof handlers[key]).toBe('function')
    }
  })

  it('инвалидирует жанровый ключ из реестра', () => {
    const { handlers, invalidate } = build()

    handlers[`records:${RecordGenre.ANIME}`]?.()

    expect(invalidate).toHaveBeenCalledWith([RECORDS_QUERY_KEYS[RecordGenre.ANIME]])
  })

  it('инвалидирует статические группы и рефетчит пользователя', () => {
    const { handlers, invalidate, refetchUser } = build()

    handlers.suggestions?.()
    handlers.stats?.()
    handlers.user?.()

    expect(invalidate).toHaveBeenCalledWith(['suggestion'])
    expect(invalidate).toHaveBeenCalledWith(['stats'])
    expect(refetchUser).toHaveBeenCalledTimes(1)
  })
})
