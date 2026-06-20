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
    return await this.prisma.limit.findUnique({ where: { name: limitType } })
  }

  async countUserSuggestions(userId: string, type: RecordType): Promise<number> {
    return await this.prisma.suggestionOwnership.count({
      where: {
        userId,
        record: { type },
      },
    })
  }

  async createSuggestion(data: CreateSuggestionData, userId: string): Promise<RecordWithRelations> {
    return await this.prisma.record.create({
      data: {
        title: data.title,
        posterUrl: data.posterUrl,
        genre: data.genre,
        link: data.link,
        status: RecordStatus.QUEUE,
        type: RecordType.SUGGESTION,
        suggestionOwnership: {
          create: {
            userId,
          },
        },
      },
      include: {
        suggestionOwnership: true,
        likes: true,
      },
    })
  }

  async findSuggestions(filters: SuggestionFilters): Promise<RecordWithRelations[]> {
    return await this.prisma.record.findMany({
      where: { type: filters.type },
      include: {
        suggestionOwnership: { include: { user: true } },
        likes: { include: { user: true } },
      },
    })
  }

  async findSuggestionById(id: number): Promise<RecordWithRelations | null> {
    return await this.prisma.record.findUnique({
      where: { id },
      include: {
        suggestionOwnership: true,
      },
    })
  }

  async findSuggestionOwner(recordId: number): Promise<{ userId: string } | null> {
    return await this.prisma.suggestionOwnership.findUnique({
      where: { recordId },
      select: { userId: true },
    })
  }

  async deleteSuggestionWithLikes(recordId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.like.deleteMany({ where: { recordId } })
      await tx.suggestionOwnership.deleteMany({ where: { recordId } })
      await tx.record.delete({ where: { id: recordId } })
    })
  }
}
