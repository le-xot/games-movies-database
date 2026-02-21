import { PrismaService } from '@/database/prisma.service'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { $Enums, Prisma } from '@prisma/client'
import { RecordsProvidersService } from '../records-providers/records-providers.service'
import { UserEntity } from '../user/user.entity'
import { RecordCreateFromLinkDTO, RecordUpdateDTO } from './record.dto'
import { RecordEntity } from './record.entity'

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name)

  constructor(private readonly prisma: PrismaService, private readonly recordsProviderService: RecordsProvidersService, private readonly eventEmitter: EventEmitter2) {}

  async createRecordFromLink(user: UserEntity, data: RecordCreateFromLinkDTO): Promise<RecordEntity> {
    this.logger.log(`Creating record from link for user=${user.id} link=${data.link}`)
    const preparedData = await this.recordsProviderService.prepareData({ link: data.link, userId: user.id })

    const createdData = await this.prisma.record.create({
      data: {
        ...preparedData,
        link: data.link,
        status: data.status || $Enums.RecordStatus.QUEUE,
        type: data.type || $Enums.RecordType.WRITTEN,
        user: { connect: { id: user.id } },
      },
    })

    if (createdData.status === $Enums.RecordStatus.QUEUE && createdData.type === $Enums.RecordType.WRITTEN) this.eventEmitter.emit('update-queue')
    if (createdData.type === $Enums.RecordType.SUGGESTION) this.eventEmitter.emit('update-suggestions')
    if (createdData.type === $Enums.RecordType.AUCTION) this.eventEmitter.emit('update-auction')
    this.logger.log(`Record created id=${createdData.id} type=${createdData.type} status=${createdData.status}`)
    return createdData
  }

  async patchRecord(id: number, data: RecordUpdateDTO): Promise<RecordEntity> {
    this.logger.log(`Patching record id=${id}`)
    const foundedRecord = await this.prisma.record.findUnique({
      where: { id },
    })
    if (!foundedRecord) {
      throw new NotFoundException('Record not found')
    }
    const updatedRecord = await this.prisma.record.update({
      where: { id },
      include: { user: true, likes: true },
      data: { ...foundedRecord, ...data },
    })

    if (foundedRecord.type === $Enums.RecordType.SUGGESTION && updatedRecord.type !== $Enums.RecordType.SUGGESTION) {
      this.eventEmitter.emit('update-suggestions')
    }

    if (
      (foundedRecord.status === $Enums.RecordStatus.QUEUE && updatedRecord.status !== $Enums.RecordStatus.QUEUE)
      || (updatedRecord.status === $Enums.RecordStatus.QUEUE && updatedRecord.type === $Enums.RecordType.WRITTEN)
      || (foundedRecord.type === $Enums.RecordType.WRITTEN && updatedRecord.type !== $Enums.RecordType.WRITTEN)
    ) {
      this.eventEmitter.emit('update-queue')
    }

    if (foundedRecord.type !== $Enums.RecordType.AUCTION && updatedRecord.type === $Enums.RecordType.AUCTION) {
      this.eventEmitter.emit('update-auction')
    }
    this.eventEmitter.emit('update-records', { genre: updatedRecord.genre })
    this.logger.log(`Record patched id=${id}`)
    return updatedRecord
  }

  async deleteRecord(id: number): Promise<void> {
    this.logger.log(`Deleting record id=${id}`)
    const foundedRecord = await this.prisma.record.findUnique({
      where: { id },
    })

    if (!foundedRecord) {
      throw new NotFoundException('Record not found')
    }

    await this.prisma.like.deleteMany({ where: { recordId: id } })
    await this.prisma.record.delete({ where: { id } })

    if (foundedRecord.type === $Enums.RecordType.SUGGESTION) {
      this.eventEmitter.emit('update-suggestions')
    }

    if (foundedRecord.status === $Enums.RecordStatus.QUEUE && foundedRecord.type === $Enums.RecordType.WRITTEN) {
      this.eventEmitter.emit('update-queue')
    }
    if (foundedRecord.type === $Enums.RecordType.AUCTION) {
      this.eventEmitter.emit('update-auction')
    }
    this.eventEmitter.emit('update-records', { genre: foundedRecord.genre })
    this.logger.log(`Record deleted id=${id}`)
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

    this.logger.log(`Fetching records page=${page} limit=${limit} filters=${JSON.stringify(filters)} orderBy=${orderBy} direction=${direction}`)
    const total = await this.prisma.record.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    const records = await this.prisma.record.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { user: true, likes: true },
      orderBy: {
        [orderBy || 'id']: direction || 'asc',
      },
      skip,
      take: limit,
    })

    this.logger.log(`Fetched ${records.length} records total=${total}`)
    return { records, total }
  }

  async findRecordById(id: number): Promise<RecordEntity> {
    this.logger.log(`Finding record by id=${id}`)
    const record = await this.prisma.record.findUnique({
      where: { id },
      include: {
        user: true,
        likes: true,
      },
    })
    if (!record) {
      throw new NotFoundException('Record not found')
    }
    this.logger.log(`Found record id=${id}`)
    return record
  }
}
