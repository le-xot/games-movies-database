import { Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}

  async createLike(userId: string, recordId: number) {
    const createdLike = await this.prisma.like.create({
      data: {
        userId,
        recordId,
      },
    })
    this.eventEmitter.emit('WebSocketUpdate')
    return createdLike
  }

  async deleteLike(userId: string, recordId: number, userRole?: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_recordId: {
          userId: userRole === 'ADMIN' ? undefined : userId,
          recordId,
        },
      },
    })

    if (!like) {
      throw new NotFoundException('Лайк не найден')
    }

    if (userRole !== 'ADMIN' && like.userId !== userId) {
      throw new NotFoundException('Лайк не найден')
    }

    await this.prisma.like.delete({
      where: { id: like.id },
    })
    this.eventEmitter.emit('WebSocketUpdate')
  }

  async getLikesByRecordId(recordId: number) {
    return await this.prisma.like.findMany({
      where: { recordId },
    })
  }

  async getLikesByUserId(userId: string) {
    return await this.prisma.like.findMany({
      where: { userId },
    })
  }

  async getLikesCountByRecordId(recordId: number) {
    return await this.prisma.like.count({
      where: { recordId },
    })
  }

  async getLikesCountByUserId(userId: string) {
    return await this.prisma.like.count({
      where: { userId },
    })
  }

  async getLikesCount() {
    return await this.prisma.like.count()
  }
}
