import { afterAll, beforeEach, expect, it } from 'bun:test'
import crypto from 'node:crypto'
import { wordleGames } from '@gmd/database/schema'
import { DrizzleWordleNotificationRepository } from '@/modules/wordle/repositories/drizzle-wordle-notification.repository'
import { DrizzleWordleRepository } from '@/modules/wordle/repositories/drizzle-wordle.repository'
import {
  createTestDb,
  createTestPool,
  integrationDescribe,
  integrationEnabled,
  truncateAll,
} from './helpers/db'
import { seedUser } from './helpers/fixtures'
import type { DrizzleService } from '@/database/drizzle.service'

const WRONG_GUESSES = ['ййййй', 'ццццц', 'ууууу', 'ккккк', 'еееее', 'ннннн']

integrationDescribe('Wordle repositories (integration)', () => {
  if (!integrationEnabled) return
  const pool = createTestPool()
  const db = createTestDb(pool)
  const repository = new DrizzleWordleRepository({ db } as unknown as DrizzleService)
  const notifications = new DrizzleWordleNotificationRepository({
    db,
  } as unknown as DrizzleService)

  beforeEach(async () => {
    await truncateAll(pool)
  })

  afterAll(async () => {
    await pool.end()
  })

  it('creates a game with defaults and returns the existing one on conflict', async () => {
    const user = await seedUser(db, 'player')
    const id = crypto.randomUUID()

    const created = await repository.createGame({
      id,
      userId: user.id,
      date: '2026-09-29',
      answer: 'манго',
    })

    expect(created.id).toBe(id)
    expect(created.guesses).toEqual([])
    expect(created.status).toBe('IN_PROGRESS')

    const conflict = await repository.createGame({
      id: crypto.randomUUID(),
      userId: user.id,
      date: '2026-09-29',
      answer: 'другое',
    })
    expect(conflict.id).toBe(id)
    expect(conflict.answer).toBe('манго')
  })

  it('marks WON on a correct guess and appends guesses', async () => {
    const user = await seedUser(db, 'player')
    const game = await repository.createGame({
      id: crypto.randomUUID(),
      userId: user.id,
      date: '2026-09-29',
      answer: 'манго',
    })

    const first = await repository.appendGuess(game.id, 'ййййй')
    expect(first?.status).toBe('IN_PROGRESS')
    expect(first?.guesses).toEqual(['ййййй'])

    const won = await repository.appendGuess(game.id, 'манго')
    expect(won?.status).toBe('WON')
    expect(won?.guesses).toEqual(['ййййй', 'манго'])
  })

  it('marks LOST after the maximum attempts and rejects further guesses', async () => {
    const user = await seedUser(db, 'player')
    const game = await repository.createGame({
      id: crypto.randomUUID(),
      userId: user.id,
      date: '2026-09-29',
      answer: 'манго',
    })

    for (const guess of WRONG_GUESSES) {
      await repository.appendGuess(game.id, guess)
    }

    const lost = await repository.findByUserAndDate(user.id, '2026-09-29')
    expect(lost?.status).toBe('LOST')
    expect(lost?.guesses).toHaveLength(6)
    expect(await repository.appendGuess(game.id, 'манго')).toBeNull()
  })

  it('closes only stale in-progress games', async () => {
    const user = await seedUser(db, 'player')
    await repository.createGame({
      id: crypto.randomUUID(),
      userId: user.id,
      date: '2026-09-28',
      answer: 'манго',
    })
    await repository.createGame({
      id: crypto.randomUUID(),
      userId: user.id,
      date: '2026-09-29',
      answer: 'манго',
    })

    const closed = await repository.closeStaleGames('2026-09-29')

    expect(closed).toBe(1)
    expect((await repository.findByUserAndDate(user.id, '2026-09-28'))?.status).toBe('LOST')
    expect((await repository.findByUserAndDate(user.id, '2026-09-29'))?.status).toBe('IN_PROGRESS')
  })

  it('lists finished games with users and counts wins by date', async () => {
    const winner = await seedUser(db, 'winner')
    const loser = await seedUser(db, 'loser')
    const won = await repository.createGame({
      id: crypto.randomUUID(),
      userId: winner.id,
      date: '2026-09-29',
      answer: 'манго',
    })
    await repository.appendGuess(won.id, 'манго')
    const inProgress = await repository.createGame({
      id: crypto.randomUUID(),
      userId: loser.id,
      date: '2026-09-29',
      answer: 'манго',
    })

    expect((await repository.findFinishedByUser(winner.id)).map((game) => game.id)).toEqual([
      won.id,
    ])
    expect((await repository.findFinishedByUser(loser.id)).map((game) => game.id)).toEqual([])

    const withUsers = await repository.findFinishedWithUsers()
    expect(withUsers.map((row) => row.user.login)).toEqual(['winner'])

    const byDate = await repository.findFinishedWithUsersByDate('2026-09-29')
    expect(byDate.map((row) => row.game.id)).toEqual([won.id])

    expect(await repository.countWinsByDate('2026-09-29')).toBe(1)
    expect(await repository.findByUserAndDate(loser.id, '2026-09-29')).not.toBeNull()
    expect(inProgress.status).toBe('IN_PROGRESS')
  })

  it('upserts notification subscriptions and drops conflicting chats', async () => {
    const first = await seedUser(db, 'first')
    const second = await seedUser(db, 'second')

    const created = await notifications.upsert({
      userId: first.id,
      chatId: 'chat-1',
      telegramUsername: 'first_tg',
    })
    expect(created.chatId).toBe('chat-1')
    expect(created.morningEnabled).toBe(true)
    expect(created.eveningEnabled).toBe(true)

    const moved = await notifications.upsert({
      userId: second.id,
      chatId: 'chat-1',
      telegramUsername: 'second_tg',
    })
    expect(moved.userId).toBe(second.id)
    expect(await notifications.findByUserId(first.id)).toBeNull()
    expect((await notifications.findByChatId('chat-1'))?.userId).toBe(second.id)
    expect(await notifications.findAll()).toHaveLength(1)
  })

  it('updates notification flags and returns null for a missing subscription', async () => {
    const user = await seedUser(db, 'player')
    await notifications.upsert({ userId: user.id, chatId: 'chat-2', telegramUsername: null })

    const updated = await notifications.updateFlags(user.id, { morningEnabled: false })
    expect(updated?.morningEnabled).toBe(false)
    expect(updated?.eveningEnabled).toBe(true)

    expect(await notifications.updateFlags('missing-user', {})).toBeNull()
  })

  it('deletes subscriptions and reports finished/won user ids', async () => {
    const winner = await seedUser(db, 'winner')
    const inProgressUser = await seedUser(db, 'slow')
    const won = await repository.createGame({
      id: crypto.randomUUID(),
      userId: winner.id,
      date: '2026-09-29',
      answer: 'манго',
    })
    await repository.appendGuess(won.id, 'манго')
    await repository.createGame({
      id: crypto.randomUUID(),
      userId: inProgressUser.id,
      date: '2026-09-29',
      answer: 'манго',
    })
    await notifications.upsert({ userId: winner.id, chatId: 'chat-3', telegramUsername: null })

    expect(await notifications.findUserIdsWonOnDate('2026-09-29')).toEqual([winner.id])
    expect((await notifications.findUserIdsFinishedOnDate('2026-09-29')).sort()).toEqual(
      [winner.id].sort(),
    )
    expect(await notifications.findFinishedGamesByUserIds([winner.id])).toHaveLength(1)
    expect(await notifications.findFinishedGamesByUserIds([])).toHaveLength(0)

    await notifications.deleteByChatId('chat-3')
    expect(await notifications.findByUserId(winner.id)).toBeNull()

    await notifications.upsert({ userId: winner.id, chatId: 'chat-4', telegramUsername: null })
    await notifications.deleteByUserId(winner.id)
    expect(await notifications.findByUserId(winner.id)).toBeNull()
    expect(await db.select().from(wordleGames)).toHaveLength(2)
  })
})
