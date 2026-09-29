import { expect, it } from 'bun:test'
import { records, suggestionRules } from '@gmd/database/schema'
import { DrizzleRecordsProvidersRepository } from '@/modules/records-providers/repositories/drizzle-records-providers.repository'
import { seedRecord } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@/database/drizzle.service'

setupIntegrationSuite('DrizzleRecordsProvidersRepository (integration)', ({ db }) => {
  const repository = new DrizzleRecordsProvidersRepository({ db } as unknown as DrizzleService)

  it('finds a record by link and genre, ignoring other genres', async () => {
    await db
      .insert(records)
      .values([
        seedRecord({ title: 'Anime', link: 'https://shikimori.one/animes/1', genre: 'ANIME' }),
        seedRecord({ title: 'Movie', link: 'https://shikimori.one/animes/1', genre: 'MOVIE' }),
      ])

    const found = await repository.findRecordByLinkAndGenre(
      'https://shikimori.one/animes/1',
      'ANIME',
    )

    expect(found?.title).toBe('Anime')
    expect(found?.genre).toBe('ANIME')
    expect(
      await repository.findRecordByLinkAndGenre('https://unknown.example/x', 'ANIME'),
    ).toBeNull()
  })

  it('returns suggestion rules per genre or null', async () => {
    await db.insert(suggestionRules).values({ genre: 'ANIME', permission: false })

    expect((await repository.findSuggestionRulesByGenre('ANIME'))?.permission).toBe(false)
    expect(await repository.findSuggestionRulesByGenre('MOVIE')).toBeNull()
  })
})
