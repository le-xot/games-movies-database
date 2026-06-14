import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { RecordGenre, RecordType } from '@/enums'
import { AuctionRepository } from '../repositories/auction.repository'
import { AuctionService } from '../auction.service'

describe('AuctionService', () => {
  let service: AuctionService
  let mockRepo: AuctionRepository
  let mockEventEmitter: { emit: ReturnType<typeof mock> }

  beforeEach(() => {
    mockRepo = createMock(AuctionRepository)
    mockEventEmitter = { emit: mock(() => {}) }
    service = new AuctionService(mockRepo, mockEventEmitter as any)
  })

  describe('getAuctions', () => {
    it('calls repository.findAuctions and returns result', async () => {
      const mockAuctions: any[] = [
        {
          id: 1,
          title: 'Test Game',
          link: 'http://example.com',
          posterUrl: 'http://example.com/poster.jpg',
          type: RecordType.AUCTION,
          genre: RecordGenre.GAME,
          user: { id: 'user1', login: 'testuser', displayName: 'Test User', avatarUrl: '' },
        },
      ]
      const findAuctions = mock(() => Promise.resolve(mockAuctions)) as unknown as AuctionRepository['findAuctions']
      mockRepo.findAuctions = findAuctions

      const result = await service.getAuctions()

      expect(result).toEqual(mockAuctions)
      expect(findAuctions).toHaveBeenCalledTimes(1)
    })
  })

  describe('getWinner', () => {
    it('calls repository.selectWinner with correct id and emits events', async () => {
      const winnerId = 42
      const mockWinner: any = {
        id: winnerId,
        title: 'Winner Game',
        link: 'http://example.com/winner',
        posterUrl: 'http://example.com/winner-poster.jpg',
        type: RecordType.WRITTEN,
        genre: RecordGenre.GAME,
        user: { id: 'user1', login: 'testuser', displayName: 'Test User', avatarUrl: '' },
      }
      const selectWinner = mock(() => Promise.resolve(mockWinner)) as unknown as AuctionRepository['selectWinner']
      mockRepo.selectWinner = selectWinner

      const result = await service.getWinner(winnerId)

      expect(result).toEqual(mockWinner)
      expect(selectWinner).toHaveBeenCalledWith(winnerId)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-auction', {
        id: winnerId,
        action: 'ended',
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('update-records', {
        genre: mockWinner.genre,
        id: winnerId,
        action: 'updated',
      })
    })

    it('propagates errors from repository.selectWinner', async () => {
      const selectWinner = mock(() => Promise.reject(new Error('Record not found'))) as unknown as AuctionRepository['selectWinner']
      mockRepo.selectWinner = selectWinner

      await expect(service.getWinner(999)).rejects.toThrow('Record not found')
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })
  })
})
