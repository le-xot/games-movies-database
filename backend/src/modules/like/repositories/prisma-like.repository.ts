import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { LikeDomain } from '../entities/like.entity'
import { LikeRepository } from './like.repository'

@Injectable()
export class PrismaLikeRepository extends LikeRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByUserAndRecord(userId: string, recordId: number): Promise<LikeDomain | null> {
    const like = await this.prisma.like.findFirst({
      where: { userId, recordId },
    })
    return like as unknown as LikeDomain | null
  }

  async create(userId: string, recordId: number): Promise<LikeDomain> {
    const like = await this.prisma.like.create({
      data: { userId, recordId },
    })
    return like as unknown as LikeDomain
  }

  async deleteByUserAndRecord(userId: string, recordId: number): Promise<number> {
    const result = await this.prisma.like.deleteMany({
      where: { userId, recordId },
    })
    return result.count
  }

  async findByRecord(recordId: number): Promise<LikeDomain[]> {
    const likes = await this.prisma.like.findMany({
      where: { recordId },
    })
    return likes as unknown as LikeDomain[]
  }

  async findByUser(userId: string): Promise<LikeDomain[]> {
    const likes = await this.prisma.like.findMany({
      where: { userId },
    })
    return likes as unknown as LikeDomain[]
  }

  async findMany(skip: number, take: number): Promise<LikeDomain[]> {
    const likes = await this.prisma.like.findMany({ skip, take })
    return likes as unknown as LikeDomain[]
  }

  async countAll(): Promise<number> {
    return await this.prisma.like.count()
  }
}
