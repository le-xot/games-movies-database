import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { RecordStatus, RecordType } from '@/enums'
import { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import { QueueRepository } from './queue.repository'

@Injectable()
export class PrismaQueueRepository extends QueueRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findQueueRecords(type: RecordType): Promise<RecordWithRelations[]> {
    return await this.prisma.record.findMany({
      where: {
        status: { in: [RecordStatus.QUEUE, RecordStatus.PROGRESS] },
        type,
      },
      include: {
        user: true,
      },
    })
  }
}
