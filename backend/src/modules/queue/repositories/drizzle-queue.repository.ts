import { DrizzleService } from '@backend/database/drizzle.service'
import { RecordStatus, RecordType } from '@backend/enums'
import { RecordWithRelations } from '@backend/modules/record/entities/record-domain.entity'
import { records } from '@gmd/database/schema'
import { and, eq, inArray } from 'drizzle-orm'

export class DrizzleQueueRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findQueueRecords(type: RecordType): Promise<RecordWithRelations[]> {
    return await this.drizzle.db.query.records.findMany({
      where: and(
        inArray(records.status, [RecordStatus.QUEUE, RecordStatus.PROGRESS]),
        eq(records.type, type),
      ),
    })
  }
}
