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
    return await this.prisma.like.findFirst({
      where: { userId, recordId },
    })
  }

  async create(userId: string, recordId: number): Promise<LikeDomain> {
    return await this.prisma.like.create({
      data: { userId, recordId },
    })
  }

  async deleteByUserAndRecord(userId: string, recordId: number): Promise<number> {
    const result = await this.prisma.like.deleteMany({
      where: { userId, recordId },
    })
    return result.count
  }

  async findByRecord(recordId: number): Promise<LikeDomain[]> {
    return await this.prisma.like.findMany({
      where: { recordId },
    })
  }

  async findByUser(userId: string): Promise<LikeDomain[]> {
    return await this.prisma.like.findMany({
      where: { userId },
    })
  }

  async findMany(skip: number, take: number): Promise<LikeDomain[]> {
    return await this.prisma.like.findMany({ skip, take })
  }

  async countAll(): Promise<number> {
    return await this.prisma.like.count()
  }
}
