import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { TelegramAuthStore } from '../telegram-auth.store'
import {
  TELEGRAM_AUTH_CONFIRMED_TTL_SECONDS,
  TELEGRAM_AUTH_TTL_SECONDS,
} from '../telegram.constants'

describe('TelegramAuthStore', () => {
  let client: { send: ReturnType<typeof mock> }
  let store: TelegramAuthStore

  beforeEach(() => {
    client = { send: mock(() => Promise.resolve(null)) }
    store = new TelegramAuthStore(client as any)
  })

  it('creates a pending token with the login mode and ttl', async () => {
    const token = await store.create('login')

    expect(token.length).toBeGreaterThan(20)
    const [command, args] = client.send.mock.calls[0] as [string, string[]]
    expect(command).toBe('SET')
    expect(args[0]).toBe(`tg:auth:${token}`)
    expect(args[2]).toBe('EX')
    expect(args[3]).toBe(String(TELEGRAM_AUTH_TTL_SECONDS))
    expect(JSON.parse(args[1])).toMatchObject({ status: 'pending', mode: 'login' })
  })

  it('stores the userId for the link mode', async () => {
    await store.create('link', 'user-1')

    const [, args] = client.send.mock.calls[0] as [string, string[]]
    expect(JSON.parse(args[1])).toMatchObject({ mode: 'link', userId: 'user-1' })
  })

  it('stores the origin when provided', async () => {
    await store.create('login', undefined, 'https://le-xot.dev')

    const [, args] = client.send.mock.calls[0] as [string, string[]]
    expect(JSON.parse(args[1])).toMatchObject({ mode: 'login', origin: 'https://le-xot.dev' })
  })

  it('removes a token', async () => {
    await store.remove('token-3')

    expect(client.send).toHaveBeenCalledWith('DEL', ['tg:auth:token-3'])
  })

  it('returns null for a missing token', async () => {
    expect(await store.get('unknown')).toBeNull()
  })

  it('confirms a pending token and shortens its ttl', async () => {
    const record = { status: 'pending', mode: 'login', createdAt: 1 }
    client.send = mock((command: string) => {
      if (command === 'GET') return Promise.resolve(JSON.stringify(record))
      return Promise.resolve('OK')
    })

    const confirmed = await store.confirm('token-1', { id: '42', firstName: 'Ivan' })

    expect(confirmed).toBe(true)
    const setCall = client.send.mock.calls.find(([command]) => command === 'SET') as [
      string,
      string[],
    ]
    expect(setCall[1][3]).toBe(String(TELEGRAM_AUTH_CONFIRMED_TTL_SECONDS))
    expect(JSON.parse(setCall[1][1])).toMatchObject({
      status: 'confirmed',
      profile: { id: '42', firstName: 'Ivan' },
    })
  })

  it('does not confirm an unknown token', async () => {
    expect(await store.confirm('missing', { id: '1', firstName: 'A' })).toBe(false)
    expect(client.send).toHaveBeenCalledTimes(1)
  })

  it('consumes a token atomically with GETDEL', async () => {
    const record = { status: 'confirmed', mode: 'login', createdAt: 1 }
    client.send = mock(() => Promise.resolve(JSON.stringify(record)))

    const result = await store.consume('token-2')

    expect(client.send).toHaveBeenCalledWith('GETDEL', ['tg:auth:token-2'])
    expect(result).toMatchObject({ status: 'confirmed' })
  })

  it('returns null when the stored value is not valid json', async () => {
    client.send = mock(() => Promise.resolve('not-json'))

    expect(await store.get('broken')).toBeNull()
  })
})
