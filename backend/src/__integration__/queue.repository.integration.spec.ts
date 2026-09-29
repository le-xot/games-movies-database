import { expect, it } from 'bun:test'
import { records } from '@gmd/database/schema'
import { DrizzleQueueRepository } from '@/modules/queue/repositories/drizzle-queue.repository'
import { seedRecord } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@/database/drizzle.service'

setupIntegrationSuite('DrizzleQueueRepository (integration)', ({ db }) => {
  const repository = new DrizzleQueueRepository({ db } as unknown as DrizzleService)

  it('returns only queue/progress records of the requested type', async () => {
    await db
      .insert(records)
      .values([
        seedRecord({ title: 'Queue game', type: 'WRITTEN', status: 'QUEUE' }),
        seedRecord({ title: 'Progress movie', type: 'WRITTEN', status: 'PROGRESS' }),
        seedRecord({ title: 'Done game', type: 'WRITTEN', status: 'DONE' }),
        seedRecord({ title: 'Queue suggestion', type: 'SUGGESTION', status: 'QUEUE' }),
      ])

    const queue = await repository.findQueueRecords('WRITTEN')

    expect(queue.map((record) => record.title).sort()).toEqual(['Progress movie', 'Queue game'])
  })
})
