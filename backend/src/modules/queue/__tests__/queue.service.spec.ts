import { beforeEach, describe, expect, it } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { RecordGenre, RecordType } from '@/enums'
import { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import { QueueRepository } from '../repositories/queue.repository'
import { QueueService } from '../queue.service'

describe('QueueService', () => {
  let service: QueueService
  let mockRepo: QueueRepository

  beforeEach(() => {
    mockRepo = createMock(QueueRepository)
    service = new QueueService(mockRepo)
  })

  it('getQueue calls repository and maps records into queue dto', async () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z')
    let receivedType: RecordType | undefined
    mockRepo.findQueueRecords = ((type: RecordType): Promise<RecordWithRelations[]> => {
      receivedType = type
      return Promise.resolve([
        {
          id: 1,
          title: 'Game 1',
          link: 'https://example.com/game-1',
          posterUrl: 'poster-1',
          genre: RecordGenre.GAME,
          type: RecordType.WRITTEN,
          createdAt,
          user: { id: 'u1', login: 'alice', role: 'USER', profileImageUrl: 'avatar-1', color: '#fff', createdAt },
        },
        {
          id: 2,
          title: 'Movie 1',
          link: 'https://example.com/movie-1',
          posterUrl: 'poster-2',
          genre: RecordGenre.MOVIE,
          type: RecordType.WRITTEN,
          createdAt,
          user: { id: 'u2', login: 'bob', role: 'USER', profileImageUrl: 'avatar-2', color: '#fff', createdAt },
        },
      ])
    }) as any

    const result = await service.getQueue()

    expect(receivedType).toBe(RecordType.WRITTEN)

    expect(result).toEqual({
      games: [
        {
          title: 'Game 1',
          login: 'alice',
          userId: 'u1',
          profileImageUrl: 'avatar-1',
          posterUrl: 'poster-1',
          createdAt: createdAt.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          link: 'https://example.com/game-1',
          type: RecordType.WRITTEN,
          genre: null,
        },
      ],
      videos: [
        {
          title: 'Movie 1',
          login: 'bob',
          userId: 'u2',
          profileImageUrl: 'avatar-2',
          posterUrl: 'poster-2',
          createdAt: createdAt.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          link: 'https://example.com/movie-1',
          type: RecordType.WRITTEN,
          genre: RecordGenre.MOVIE,
        },
      ],
    })
  })
})
