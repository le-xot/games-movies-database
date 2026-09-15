import { records } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, eq, inArray } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { RecordStatus, RecordType } from '@/enums'
import { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import { QueueRepository } from './queue.repository'

@Injectable()
export class DrizzleQueueRepository extends QueueRepository {
  constructor(private readonly drizzle: DrizzleService) {
    super()
  }

  async findQueueRecords(type: RecordType): Promise<RecordWithRelations[]> {
    return await this.drizzle.db.query.records.findMany({
      where: and(
        inArray(records.status, [RecordStatus.QUEUE, RecordStatus.PROGRESS]),
        eq(records.type, type),
      ),
    })
  }
}
