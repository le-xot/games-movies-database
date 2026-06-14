import { RecordType } from '@/enums'
import { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'

export abstract class QueueRepository {
  abstract findQueueRecords(type: RecordType): Promise<RecordWithRelations[]>
}
