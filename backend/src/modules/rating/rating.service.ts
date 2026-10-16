import { records, users } from '@gmd/database/schema'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { eq } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { RecordGrade } from '@/enums'
import {
  CommunityCounts,
  emptyCommunityCounts,
} from '@/modules/rating/entities/rating-domain.entity'
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

  async getUserRatings(
    viewerId: string | undefined,
    profileUserId: string,
    page: number = 1,
    limit: number = 10,
    grades?: RecordGrade[],
  ) {
    const profile = await this.drizzle.db.query.users.findFirst({
      where: eq(users.id, profileUserId),
      columns: { id: true, login: true },
    })
    if (!profile) {
      throw new NotFoundException('User not found')
    }

    const skip = (page - 1) * limit
    const [total, rows] = await Promise.all([
      this.ratingRepository.countByUser(profileUserId, grades),
      this.ratingRepository.findByUserWithRecords(profileUserId, grades, skip, limit),
    ])

    const ids = rows.map((row) => row.record.id)
    const [aggregates, myGrades] = await Promise.all([
      this.ratingRepository.aggregateByRecords(ids),
      viewerId
        ? this.ratingRepository.findMyGrades(viewerId, ids)
        : Promise.resolve(new Map<number, RecordGrade>()),
    ])

    const items = rows.map(({ rating, record }) => {
      const aggregate = aggregates.get(record.id)
      return {
        ...record,
        communityCounts: aggregate?.counts ?? emptyCommunityCounts(),
        communityTotal: aggregate?.total ?? 0,
        communityTop: aggregate?.top ?? null,
        myGrade: myGrades.get(record.id) ?? null,
        userGrade: rating.grade,
        userLogin: profile.login,
      }
    })

    return { items, total }
  }

  async getCommunity(): Promise<
    Array<{
      userId: string
      login: string
      profileImageUrl: string
      counts: CommunityCounts
      total: number
    }>
  > {
    const members = await this.ratingRepository.getCommunityOverview()
    return members
      .map((member) => ({
        ...member,
        total:
          member.counts.DISLIKE + member.counts.BEER + member.counts.LIKE + member.counts.RECOMMEND,
      }))
      .sort((a, b) => b.total - a.total)
  }
}
