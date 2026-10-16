import { records } from '@gmd/database/schema'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { eq } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { RecordGrade } from '@/enums'
import { WsEvents, emitWs } from '@/modules/websocket/websocket.events'
import { DrizzleRatingRepository } from './repositories/drizzle-rating.repository'

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name)

  constructor(
    private readonly ratingRepository: DrizzleRatingRepository,
    private readonly drizzle: DrizzleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async rate(userId: string, recordId: number, grade: RecordGrade) {
    this.logger.log(`Rating record userId=${userId} recordId=${recordId} grade=${grade}`)
    const record = await this.drizzle.db.query.records.findFirst({
      where: eq(records.id, recordId),
      columns: { id: true },
    })
    if (!record) {
      throw new NotFoundException('Record not found')
    }

    const existing = await this.ratingRepository.findByUserAndRecord(userId, recordId)
    const rating = await this.ratingRepository.upsert(userId, recordId, grade)
    emitWs(this.eventEmitter, WsEvents.UPDATE_RATINGS, {
      recordId,
      userId,
      grade,
      action: existing ? 'updated' : 'created',
    })
    this.logger.log(`Rating saved userId=${userId} recordId=${recordId}`)
    return rating
  }

  async unrate(userId: string, recordId: number) {
    this.logger.log(`Removing rating userId=${userId} recordId=${recordId}`)
    const deletedCount = await this.ratingRepository.deleteByUserAndRecord(userId, recordId)

    if (deletedCount === 0) {
      throw new NotFoundException('Оценка не найдена')
    }

    emitWs(this.eventEmitter, WsEvents.UPDATE_RATINGS, {
      recordId,
      userId,
      grade: null,
      action: 'deleted',
    })
    this.logger.log(`Rating removed userId=${userId} recordId=${recordId}`)
  }
}
