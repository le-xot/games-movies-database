import { PrismaService } from '@/database/prisma.service'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class LikeService {
  private readonly logger = new Logger(LikeService.name)
  constructor(private prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}

  async createLike(userId: string, recordId: number) {
    this.logger.log(`Creating like userId=${userId} recordId=${recordId}`)
    const existingLike = await this.prisma.like.findFirst({
      where: { userId, recordId },
    })

    if (existingLike) {
      throw new BadRequestException('Вы уже поставили лайк этой записи')
    }

    const createdLike = await this.prisma.like.create({
      data: {
        userId,
        recordId,
      },
    })
    this.eventEmitter.emit('update-likes')
    this.logger.log(`Like created id=${createdLike.id}`)
    return createdLike
  }

  async deleteLike(userId: string, recordId: number) {
    this.logger.log(`Deleting like userId=${userId} recordId=${recordId}`)
    const deletedLike = await this.prisma.like.deleteMany({
      where: { userId, recordId },
    })

    if (deletedLike.count === 0) {
      throw new NotFoundException('Лайк не найден')
    }

    this.eventEmitter.emit('update-likes')
    this.logger.log(`Like deleted count=${deletedLike.count}`)
  }

  async getLikesByRecordId(recordId: number) {
    const likes = await this.prisma.like.findMany({
      where: { recordId },
    })
    return { likes, total: likes.length }
  }

  async getLikesByUserId(userId: string) {
    const likes = await this.prisma.like.findMany({
      where: { userId },
    })
    return { likes, total: likes.length }
  }

  async getLikes(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const total = await this.prisma.like.count()
    const likes = await this.prisma.like.findMany({
      skip,
      take: limit,
    })

    return { likes, total }
  }
}
