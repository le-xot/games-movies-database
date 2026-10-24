import { describe, expect, it, mock } from 'bun:test'
import { createTestGateway } from '@/__tests__/helpers/gateway-stub'
import type { GatewayUser } from '@/gateway/auth'

const USER: GatewayUser = {
  id: 'user-1',
  login: 'le-xot',
  role: 'USER',
  profileImageUrl: '',
  color: '#000000',
  hasCustomAvatar: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const STATE = {
  date: '2026-03-01',
  status: 'IN_PROGRESS' as const,
  attempts: 1,
  maxAttempts: 6,
  wordLength: 5,
  guesses: [{ word: 'слово', states: ['CORRECT', 'PRESENT', 'ABSENT', 'ABSENT', 'ABSENT'] }],
  answer: null,
  msUntilNextWord: 1000,
}

function build(options: { user?: GatewayUser | null; practice?: unknown } = {}) {
  const makeGuess = mock(async () => STATE)
  const gateway = createTestGateway({
    auth: { resolve: async () => options.user ?? null },
    wordle: {
      getState: async () => STATE,
      makeGuess,
      getStats: async () => {
        throw new Error('getStats не заглушен')
      },
      getLeaderboard: async () => {
        throw new Error('getLeaderboard не заглушен')
      },
      getPracticeState: async () => (options.practice ?? null) as never,
      startPractice: async () => {
        throw new Error('startPractice не заглушен')
      },
      makePracticeGuess: async () => {
        throw new Error('makePracticeGuess не заглушен')
      },
    },
  })

  return { gateway, makeGuess }
}

function request(path: string, init: RequestInit = {}, cookie = true) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(cookie ? { cookie: 'token=jwt' } : {}), ...(init.headers ?? {}) },
  })
}

describe('wordle', () => {
  it('rejects the state request without a session', async () => {
    const response = await build().gateway.handle(request('/wordle/state', {}, false))

    expect(response.status).toBe(401)
  })

  it('returns the daily state', async () => {
    const response = await build({ user: USER }).gateway.handle(request('/wordle/state'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(STATE)
  })

  it('passes the guess word to the domain', async () => {
    const { gateway, makeGuess } = build({ user: USER })

    const response = await gateway.handle(
      request('/wordle/guess', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ word: 'слово' }),
      }),
    )

    expect(response.status).toBe(200)
    expect(makeGuess).toHaveBeenCalledWith(USER.id, 'слово')
  })

  it('rejects a guess without a word', async () => {
    const response = await build({ user: USER }).gateway.handle(
      request('/wordle/guess', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('serves null when there is no practice session', async () => {
    const response = await build({ user: USER }).gateway.handle(request('/wordle/practice'))

    expect(response.status).toBe(200)
    expect(await response.json()).toBeNull()
  })

  it('serves an existing practice session', async () => {
    const practice = {
      status: 'IN_PROGRESS' as const,
      attempts: 0,
      maxAttempts: 6,
      wordLength: 5,
      guesses: [],
      answer: null,
    }

    const response = await build({ user: USER, practice }).gateway.handle(
      request('/wordle/practice'),
    )

    expect(await response.json()).toEqual(practice)
  })

  it('disconnects notifications and answers ok', async () => {
    const response = await build({ user: USER }).gateway.handle(
      request('/wordle/notifications', { method: 'DELETE' }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })
})
