import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { LimitType, RecordStatus, RecordType } from '@/enums'
import { LimitDomain } from '@/modules/limit/entities/limit.entity'
import { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import {
  CreateSuggestionData,
  SuggestionFilters,
  SuggestionRepository,
} from './suggestion.repository'

@Injectable()
export class PrismaSuggestionRepository extends SuggestionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findLimit(limitType: LimitType): Promise<LimitDomain | null> {
    const limit = await this.prisma.limit.findUnique({ where: { name: limitType } })
    if (!limit) return null
    return { name: limit.name as unknown as LimitType, value: limit.quantity }
  }

  async countUserSuggestions(userId: string, type: RecordType): Promise<number> {
    return await this.prisma.record.count({ where: { userId, type } })
  }

  async createSuggestion(data: CreateSuggestionData): Promise<RecordWithRelations> {
    return await this.prisma.record.create({
      data: {
        title: data.title,
        posterUrl: data.posterUrl,
        genre: data.genre as any,
        link: data.link,
        status: RecordStatus.QUEUE,
        type: RecordType.SUGGESTION,
        user: { connect: { id: data.userId } },
      },
    }) as unknown as RecordWithRelations
  }

  async findSuggestions(filters: SuggestionFilters): Promise<RecordWithRelations[]> {
    return await this.prisma.record.findMany({
      where: { type: filters.type },
      include: { user: true, likes: true },
    }) as unknown as RecordWithRelations[]
  }

  async findSuggestionById(id: number): Promise<RecordWithRelations | null> {
    return await this.prisma.record.findUnique({
      where: { id },
    }) as unknown as RecordWithRelations | null
  }

  async deleteSuggestionWithLikes(recordId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.like.deleteMany({ where: { recordId } })
      await tx.record.delete({ where: { id: recordId } })
    })
  }
}
