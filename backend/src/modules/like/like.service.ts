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
    const where = userRole === 'ADMIN' ? { recordId } : { userId, recordId }
    const like = await this.prisma.like.findFirst({ where })

    if (!like) {
      throw new NotFoundException('Лайк не найден')
    }

    if (userRole !== 'ADMIN' && like.userId !== userId) {
      throw new NotFoundException('Нет доступа')
    }

    await this.prisma.like.delete({
      where: { id: like.id },
    })

    this.eventEmitter.emit('WebSocketUpdate')
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

  async getLikes() {
    const likes = await this.prisma.like.findMany()
    return { likes, total: likes.length }
  }
}
