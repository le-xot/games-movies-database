import { expect, it } from 'bun:test'
import { records } from '@gmd/database/schema'
import { DrizzleStatsRepository } from '@/modules/stats/repositories/drizzle-stats.repository'
import { seedRecord } from './helpers/fixtures'
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
})
