import { expect, it } from 'bun:test'
import crypto from 'node:crypto'
import { recordRatings, records } from '@gmd/database/schema'
import { DrizzleStatsRepository } from '@/modules/stats/repositories/drizzle-stats.repository'
import { seedRecord, seedUser } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@/database/drizzle.service'

setupIntegrationSuite('DrizzleStatsRepository (integration)', ({ db }) => {
  const repository = new DrizzleStatsRepository({ db } as unknown as DrizzleService)

  async function seedStatsFixture() {
    await db.insert(records).values([
      seedRecord({ title: 'Game done', genre: 'GAME', status: 'DONE', grade: 'LIKE' }),
      seedRecord({ title: 'Movie progress', genre: 'MOVIE', status: 'PROGRESS', grade: 'LIKE' }),
      seedRecord({ title: 'Anime excluded', genre: 'ANIME', status: 'NOTINTERESTED' }),
      seedRecord({
        title: 'Suggestion excluded',
        type: 'SUGGESTION',
        genre: 'GAME',
        status: 'DONE',
      }),
      seedRecord({ title: 'Movie null status', genre: 'MOVIE', status: null }),
      seedRecord({ title: 'No genre', genre: null, status: 'DONE' }),
    ])
  }

  it('counts only written records that are not NOTINTERESTED', async () => {
    await seedStatsFixture()

    expect(await repository.countTotal()).toBe(4)
  })

  it('groups by genre, status and grade excluding nulls', async () => {
    await seedStatsFixture()

    const byGenre = await repository.countByGenre()
    expect(byGenre.sort((a, b) => a.genre.localeCompare(b.genre))).toEqual([
      { genre: 'GAME', count: 1 },
      { genre: 'MOVIE', count: 2 },
    ])

    const byStatus = await repository.countByStatus()
    expect(byStatus.sort((a, b) => a.status.localeCompare(b.status))).toEqual([
      { status: 'DONE', count: 2 },
      { status: 'PROGRESS', count: 1 },
    ])

    const byGrade = await repository.countByGrade()
    expect(byGrade).toEqual([{ grade: 'LIKE', count: 2 }])
  })

  it('groups genre with status and grade', async () => {
    await seedStatsFixture()

    const byGenreStatus = await repository.countByGenreStatus()
    expect(
      byGenreStatus.sort((a, b) =>
        `${a.genre}:${a.status}`.localeCompare(`${b.genre}:${b.status}`),
      ),
    ).toEqual([
      { genre: 'GAME', status: 'DONE', count: 1 },
      { genre: 'MOVIE', status: 'PROGRESS', count: 1 },
    ])

    const byGenreGrade = await repository.countByGenreGrade()
    expect(
      byGenreGrade.sort((a, b) => `${a.genre}:${a.grade}`.localeCompare(`${b.genre}:${b.grade}`)),
    ).toEqual([
      { genre: 'GAME', grade: 'LIKE', count: 1 },
      { genre: 'MOVIE', grade: 'LIKE', count: 1 },
    ])
  })

  it('counts friends votes only on in-scope records', async () => {
    const user1 = await seedUser(db, 'voter-1')
    const user2 = await seedUser(db, 'voter-2')
    const [done, ignored] = await db
      .insert(records)
      .values([
        seedRecord({ title: 'Voted game', genre: 'GAME', status: 'DONE' }),
        seedRecord({ title: 'Ignored anime', genre: 'ANIME', status: 'NOTINTERESTED' }),
      ])
      .returning()
    if (!done || !ignored) throw new Error('seed failed')
    await db.insert(recordRatings).values([
      { id: crypto.randomUUID(), userId: user1.id, recordId: done.id, grade: 'RECOMMEND' },
      { id: crypto.randomUUID(), userId: user2.id, recordId: done.id, grade: 'LIKE' },
      { id: crypto.randomUUID(), userId: user1.id, recordId: ignored.id, grade: 'DISLIKE' },
    ])

    const byFriendsGrade = await repository.countByFriendsGrade()
    expect(byFriendsGrade.sort((a, b) => a.grade.localeCompare(b.grade))).toEqual([
      { grade: 'LIKE', count: 1 },
      { grade: 'RECOMMEND', count: 1 },
    ])
  })

  it('counts friends votes by genre and grade only within scope', async () => {
    const voter1 = await seedUser(db, 'genre-voter-1')
    const voter2 = await seedUser(db, 'genre-voter-2')
    const [game, anime, suggestion, noGenre] = await db
      .insert(records)
      .values([
        seedRecord({ title: 'Game done', genre: 'GAME', status: 'DONE' }),
        seedRecord({ title: 'Anime excluded', genre: 'ANIME', status: 'NOTINTERESTED' }),
        seedRecord({
          title: 'Suggestion excluded',
          type: 'SUGGESTION',
          genre: 'GAME',
          status: 'DONE',
        }),
        seedRecord({ title: 'No genre', genre: null, status: 'DONE' }),
      ])
      .returning()
    if (!game || !anime || !suggestion || !noGenre) throw new Error('seed failed')
    await db.insert(recordRatings).values([
      { id: crypto.randomUUID(), userId: voter1.id, recordId: game.id, grade: 'RECOMMEND' },
      { id: crypto.randomUUID(), userId: voter2.id, recordId: game.id, grade: 'RECOMMEND' },
      { id: crypto.randomUUID(), userId: voter1.id, recordId: anime.id, grade: 'DISLIKE' },
      { id: crypto.randomUUID(), userId: voter1.id, recordId: suggestion.id, grade: 'BEER' },
      { id: crypto.randomUUID(), userId: voter2.id, recordId: noGenre.id, grade: 'LIKE' },
    ])

    expect(await repository.countByFriendsGenreGrade()).toEqual([
      { genre: 'GAME', grade: 'RECOMMEND', count: 2 },
    ])
  })
})
