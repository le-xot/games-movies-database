import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import cookieParser from 'cookie-parser'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { UserService } from '@/modules/user/user.service'
import { WordleController } from '@/modules/wordle/wordle.controller'
import { WordleService } from '@/modules/wordle/wordle.service'
import type { INestApplication } from '@nestjs/common'
import type { AddressInfo } from 'node:net'

const leaderboard = {
  entries: [],
  totalPlayers: 0,
  totalGames: 0,
  winsToday: 0,
  today: { entries: [], total: 0 },
}

describe('WordleController guards', () => {
  let app: INestApplication
  let baseUrl: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WordleController],
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: { verifyAsync: mock() } },
        { provide: UserService, useValue: {} },
        {
          provide: WordleService,
          useValue: {
            getLeaderboard: mock().mockResolvedValue(leaderboard),
            getState: mock(),
            getStats: mock(),
            makeGuess: mock(),
          },
        },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.use(cookieParser())
    await app.listen(0)
    const address = app.getHttpServer().address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves the leaderboard without authentication', async () => {
    const response = await fetch(`${baseUrl}/wordle/leaderboard`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(leaderboard)
  })

  it('rejects unauthenticated state requests', async () => {
    const response = await fetch(`${baseUrl}/wordle/state`)

    expect(response.status).toBe(401)
  })

  it('rejects unauthenticated stats requests', async () => {
    const response = await fetch(`${baseUrl}/wordle/stats`)

    expect(response.status).toBe(401)
  })

  it('rejects unauthenticated guesses', async () => {
    const response = await fetch(`${baseUrl}/wordle/guess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ word: 'слово' }),
    })

    expect(response.status).toBe(401)
  })
})
