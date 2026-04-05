import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '@/database/prisma.service'
import {
  RecordFilterOptions,
  RecordSortOptions,
  RecordWithRelations,
} from '@/modules/record/entities/record-domain.entity'
import {
  CreateRecordData,
  RecordRepository,
  UpdateRecordData,
} from './record.repository'

@Injectable()
export class PrismaRecordRepository extends RecordRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async create(data: CreateRecordData): Promise<RecordWithRelations> {
    return await this.prisma.record.create({
      data: {
        title: data.title,
        posterUrl: data.posterUrl,
        genre: data.genre as any,
        link: data.link,
        status: data.status as any,
        type: data.type as any,
        user: { connect: { id: data.userId } },
      },
    }) as unknown as RecordWithRelations
  }

  async findById(id: number): Promise<RecordWithRelations | null> {
    return await this.prisma.record.findUnique({
      where: { id },
      include: { user: true, likes: true },
    }) as unknown as RecordWithRelations | null
  }

  private buildWhere(filters: RecordFilterOptions): Prisma.RecordWhereInput {
    const where: Prisma.RecordWhereInput = {}

    if (filters.search) {
      where.OR = [
        {
          title: {
            contains: filters.search.trim(),
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          user: {
            login: {
              contains: filters.search.trim(),
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      ]
    }

    if (filters.status) where.status = filters.status
    if (filters.type) where.type = filters.type
    if (filters.grade) where.grade = filters.grade
    if (filters.userId) where.userId = filters.userId
    if (filters.genre) where.genre = filters.genre

    return where
  }

  async findAll(
    filters: RecordFilterOptions,
    sort: RecordSortOptions,
    pagination: { skip: number; take: number },
  ): Promise<RecordWithRelations[]> {
    const where = this.buildWhere(filters)
    return await this.prisma.record.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { user: true, likes: true },
      orderBy: { [sort.orderBy || 'id']: sort.direction || 'asc' },
      skip: pagination.skip,
      take: pagination.take,
    }) as unknown as RecordWithRelations[]
  }

  async count(filters: RecordFilterOptions): Promise<number> {
    const where = this.buildWhere(filters)
    return await this.prisma.record.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    })
  }

  async update(id: number, data: UpdateRecordData): Promise<RecordWithRelations> {
    return await this.prisma.record.update({
      where: { id },
      include: { user: true, likes: true },
      data: data as any,
    }) as unknown as RecordWithRelations
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.like.deleteMany({ where: { recordId: id } })
      await tx.record.delete({ where: { id } })
    })
  }
}
