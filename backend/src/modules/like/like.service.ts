import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import type { UpdateLikesPayload } from '@/modules/websocket/websocket.events'
import { LikeRepository } from './repositories/like.repository'

@Injectable()
export class LikeService {
  private readonly logger = new Logger(LikeService.name)
  constructor(
    private readonly likeRepository: LikeRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createLike(userId: string, recordId: number) {
    this.logger.log(`Creating like userId=${userId} recordId=${recordId}`)
    const existingLike = await this.likeRepository.findByUserAndRecord(userId, recordId)

    if (existingLike) {
      throw new BadRequestException('Вы уже поставили лайк этой записи')
    }

    const createdLike = await this.likeRepository.create(userId, recordId)
    this.eventEmitter.emit('update-likes', {
      recordId,
      userId,
      action: 'created',
    } satisfies UpdateLikesPayload)
    this.logger.log(`Like created id=${createdLike.id}`)
    return createdLike
  }

  async deleteLike(userId: string, recordId: number) {
    this.logger.log(`Deleting like userId=${userId} recordId=${recordId}`)
    const deletedCount = await this.likeRepository.deleteByUserAndRecord(userId, recordId)

    if (deletedCount === 0) {
      throw new NotFoundException('Лайк не найден')
    }

    this.eventEmitter.emit('update-likes', {
      recordId,
      userId,
      action: 'deleted',
    } satisfies UpdateLikesPayload)
    this.logger.log(`Like deleted count=${deletedCount}`)
  }

  async getLikesByRecordId(recordId: number) {
    const likes = await this.likeRepository.findByRecord(recordId)
    return { likes, total: likes.length }
  }

  async getLikesByUserId(userId: string) {
    const likes = await this.likeRepository.findByUser(userId)
    return { likes, total: likes.length }
  }

  async getLikes(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const total = await this.likeRepository.countAll()
    const likes = await this.likeRepository.findMany(skip, limit)

    return { likes, total }
  }
}
