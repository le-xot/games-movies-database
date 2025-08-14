import { Injectable, NotFoundException } from '@nestjs/common'
import { $Enums, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { RecordsProvidersService } from '../records-providers/records-providers.service'
import { UserEntity } from '../user/user.entity'
import { RecordCreateFromLinkDTO, RecordUpdateDTO } from './record.dto'
import { RecordEntity } from './record.entity'

@Injectable()
export class RecordService {
  constructor(private readonly prisma: PrismaService, private readonly recordsProviderService: RecordsProvidersService) {}

  async createRecordFromLink(user: UserEntity, data: RecordCreateFromLinkDTO): Promise<RecordEntity> {
    const preparedData = await this.recordsProviderService.prepareData({ link: data.link, userId: user.id })

    return this.prisma.record.create({
      data: {
        ...preparedData,
        link: data.link,
        status: data.status || $Enums.RecordStatus.QUEUE,
        type: data.type || $Enums.RecordType.WRITTEN,
        user: { connect: { id: user.id } },
      },
    })
  }

  async patchRecord(id: number, data: RecordUpdateDTO): Promise<RecordEntity> {
    const foundedRecord = await this.prisma.record.findUnique({
      where: { id },
    })
    if (!foundedRecord) {
      throw new NotFoundException('Record not found')
    }
    return this.prisma.record.update({
      where: { id },
      include: { user: true },
      data: { ...foundedRecord, ...data },
    })
  }

  async deleteRecord(id: number): Promise<void> {
    await this.prisma.record.delete({ where: { id } })
  }

  async getAllRecords(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string
      status?: $Enums.RecordStatus
      type?: $Enums.RecordType
      grade?: $Enums.RecordGrade
      userId?: string
      genre?: $Enums.RecordGenre
    },
    orderBy?: 'title' | 'id',
    direction?: 'asc' | 'desc',
  ): Promise<{ records: RecordEntity[], total: number }> {
    const skip = (page - 1) * limit
    const where: Prisma.RecordWhereInput = {}

    if (filters?.search) {
      where.OR = [
        {
          title: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          user: {
            login: {
              contains: filters.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      ]
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.grade) {
      where.grade = filters.grade
    }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.genre) {
      where.genre = filters.genre
    }

    const total = await this.prisma.record.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    const records = await this.prisma.record.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { user: true },
      orderBy: {
        [orderBy || 'id']: direction || 'asc',
      },
      skip,
      take: limit,
    })

    return { records, total }
  }

  async findRecordById(id: number): Promise<RecordEntity> {
    const record = await this.prisma.record.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })
    if (!record) {
      throw new NotFoundException('Record not found')
    }
    return record
  }
}
