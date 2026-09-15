import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { LimitType } from '@/enums'
import { LimitService } from '../limit.service'
import { DrizzleLimitRepository } from '../repositories/drizzle-limit.repository'

describe('LimitService', () => {
  let service: LimitService
  let mockRepo: DrizzleLimitRepository

  beforeEach(() => {
    mockRepo = createMock(DrizzleLimitRepository)
    service = new LimitService(mockRepo)
  })

  it('changeLimit calls repository.update with correct params', async () => {
    const mockResult: any = { name: LimitType.SUGGESTION, value: 5 }
    const update = mock(() =>
      Promise.resolve(mockResult),
    ) as unknown as DrizzleLimitRepository['update']
    mockRepo.update = update

    const result = await service.changeLimit({ name: LimitType.SUGGESTION, quantity: 5 })

    expect(result).toEqual(mockResult)
    expect(update).toHaveBeenCalledWith(LimitType.SUGGESTION, 5)
  })
})
