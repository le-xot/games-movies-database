import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import type { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'

/** Full record row fixture: every column present, nullable columns set to null. */
export function makeRecordRow(overrides: Partial<RecordWithRelations> = {}): RecordWithRelations {
  return {
    id: 1,
    title: 'Test Record',
    link: 'https://example.com/1',
    posterUrl: 'http://img.example.com/1.jpg',
    status: RecordStatus.QUEUE,
    type: RecordType.WRITTEN,
    genre: RecordGenre.ANIME,
    grade: null,
    episode: null,
    extra: null,
    createdAt: new Date('2026-01-02T03:04:05.000Z'),
    ...overrides,
  }
}
