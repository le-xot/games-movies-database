import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'
import { RecordCreateFromLinkDTO, RecordUpdateDTO } from '@/modules/record/record.dto'
import { RecordEntity } from '@/modules/record/record.entity'
import { RecordRepository } from '@/modules/record/repositories/record.repository'
import { RecordsProvidersService } from '@/modules/records-providers/records-providers.service'
import { UserEntity } from '@/modules/user/user.entity'
import type {
  UpdateAuctionPayload,
  UpdateQueuePayload,
  UpdateRecordsPayload,
  UpdateSuggestionsPayload,
} from '@/modules/websocket/websocket.events'

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name)

  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly recordsProviderService: RecordsProvidersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createRecordFromLink(
    user: UserEntity,
    data: RecordCreateFromLinkDTO,
  ): Promise<RecordEntity> {
    this.logger.log(`Creating record from link for user=${user.id} link=${data.link}`)
    const preparedData = await this.recordsProviderService.prepareData({
      link: data.link,
      userId: user.id,
    })

    const createdData = await this.recordRepository.create({
      ...preparedData,
      link: data.link,
      status: data.status || RecordStatus.QUEUE,
      type: data.type || RecordType.WRITTEN,
      userId: user.id,
    })

    if (
      createdData.status === RecordStatus.QUEUE &&
      createdData.type === RecordType.WRITTEN
    )
      this.eventEmitter.emit('update-queue', {
        id: createdData.id,
        action: 'created',
      } satisfies UpdateQueuePayload)
    if (createdData.type === RecordType.SUGGESTION)
      this.eventEmitter.emit('update-suggestions', {
        id: createdData.id,
        action: 'created',
      } satisfies UpdateSuggestionsPayload)
    if (createdData.type === RecordType.AUCTION)
      this.eventEmitter.emit('update-auction', {
        id: createdData.id,
        action: 'created',
      } satisfies UpdateAuctionPayload)
    this.logger.log(
      `Record created id=${createdData.id} type=${createdData.type} status=${createdData.status}`,
    )
    return createdData as unknown as RecordEntity
  }

  async patchRecord(id: number, data: RecordUpdateDTO): Promise<RecordEntity> {
    this.logger.log(`Patching record id=${id}`)
    const foundedRecord = await this.recordRepository.findById(id)
    if (!foundedRecord) {
      throw new NotFoundException('Record not found')
    }
    const updatedRecord = await this.recordRepository.update(id, { ...foundedRecord, ...data } as any)

    if (
      foundedRecord.type === RecordType.SUGGESTION &&
      updatedRecord.type !== RecordType.SUGGESTION
    ) {
      this.eventEmitter.emit('update-suggestions', {
        id: updatedRecord.id,
        action: 'updated',
      } satisfies UpdateSuggestionsPayload)
    }

    if (
      (foundedRecord.status === RecordStatus.QUEUE &&
        updatedRecord.status !== RecordStatus.QUEUE) ||
      (updatedRecord.status === RecordStatus.QUEUE &&
        updatedRecord.type === RecordType.WRITTEN) ||
      (foundedRecord.type === RecordType.WRITTEN &&
        updatedRecord.type !== RecordType.WRITTEN)
    ) {
      this.eventEmitter.emit('update-queue', {
        id: updatedRecord.id,
        action: 'updated',
      } satisfies UpdateQueuePayload)
    }

    if (
      foundedRecord.type !== RecordType.AUCTION &&
      updatedRecord.type === RecordType.AUCTION
    ) {
      this.eventEmitter.emit('update-auction', {
        id: updatedRecord.id,
        action: 'created',
      } satisfies UpdateAuctionPayload)
    }
    this.eventEmitter.emit('update-records', {
      genre: updatedRecord.genre as unknown as RecordGenre,
      id: updatedRecord.id,
      action: 'updated',
    } satisfies UpdateRecordsPayload)
    this.logger.log(`Record patched id=${id}`)
    return updatedRecord as unknown as RecordEntity
  }

  async deleteRecord(id: number): Promise<void> {
    this.logger.log(`Deleting record id=${id}`)
    const foundedRecord = await this.recordRepository.findById(id)

    if (!foundedRecord) {
      throw new NotFoundException('Record not found')
    }

    await this.recordRepository.delete(id)

    if (foundedRecord.type === RecordType.SUGGESTION) {
      this.eventEmitter.emit('update-suggestions', {
        id: foundedRecord.id,
        action: 'deleted',
      } satisfies UpdateSuggestionsPayload)
    }

    if (
      foundedRecord.status === RecordStatus.QUEUE &&
      foundedRecord.type === RecordType.WRITTEN
    ) {
      this.eventEmitter.emit('update-queue', {
        id: foundedRecord.id,
        action: 'deleted',
      } satisfies UpdateQueuePayload)
    }
    if (foundedRecord.type === RecordType.AUCTION) {
      this.eventEmitter.emit('update-auction', {
        id: foundedRecord.id,
        action: 'deleted',
      } satisfies UpdateAuctionPayload)
    }
    this.eventEmitter.emit('update-records', {
      genre: foundedRecord.genre as unknown as RecordGenre,
      id: foundedRecord.id,
      action: 'deleted',
    } satisfies UpdateRecordsPayload)
    this.logger.log(`Record deleted id=${id}`)
  }

  async getAllRecords(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string
      status?: RecordStatus
      type?: RecordType
      grade?: RecordGrade
      userId?: string
      genre?: RecordGenre
    },
    orderBy?: 'title' | 'id',
    direction?: 'asc' | 'desc',
  ): Promise<{ records: RecordEntity[]; total: number }> {
    const skip = (page - 1) * limit
    const filterOptions = {
      search: filters?.search,
      status: filters?.status,
      type: filters?.type,
      grade: filters?.grade,
      userId: filters?.userId,
      genre: filters?.genre,
    }
    const sortOptions = { orderBy, direction }

    const [total, records] = await Promise.all([
      this.recordRepository.count(filterOptions),
      this.recordRepository.findAll(filterOptions, sortOptions, { skip, take: limit }),
    ])

    return { records: records as unknown as RecordEntity[], total }
  }

  async findRecordById(id: number): Promise<RecordEntity> {
    const record = await this.recordRepository.findById(id)
    if (!record) {
      throw new NotFoundException('Record not found')
    }
    return record as unknown as RecordEntity
  }
}
