import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { LimitType } from '@/enums'
import { LimitRepository } from '../repositories/limit.repository'
import { LimitService } from '../limit.service'

describe('LimitService', () => {
  let service: LimitService
  let mockRepo: LimitRepository

  beforeEach(() => {
    mockRepo = createMock(LimitRepository)
    service = new LimitService(mockRepo)
  })

  it('changeLimit calls repository.update with correct params', async () => {
    const mockResult: any = { name: LimitType.SUGGESTION, value: 5 }
    const update = mock(() => Promise.resolve(mockResult)) as unknown as LimitRepository['update']
    mockRepo.update = update

    const result = await service.changeLimit({ name: LimitType.SUGGESTION, quantity: 5 })

    expect(result).toEqual(mockResult)
    expect(update).toHaveBeenCalledWith(LimitType.SUGGESTION, 5)
  })
})
