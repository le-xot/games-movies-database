import { Buffer } from 'node:buffer'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'
import { ImgService } from '@/modules/img/img.service'
import { RecordCreateFromLinkDTO, RecordUpdateDTO } from '@/modules/record/record.dto'
import { RecordEntity } from '@/modules/record/record.entity'
import { DrizzleRecordRepository } from '@/modules/record/repositories/drizzle-record.repository'
import { RecordsProvidersService } from '@/modules/records-providers/records-providers.service'
import {
  WsEvents,
  type UpdateQueuePayload,
  type UpdateRecordsPayload,
  type UpdateSuggestionsPayload,
} from '@/modules/websocket/websocket.events'

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name)

  constructor(
    private readonly recordRepository: DrizzleRecordRepository,
    private readonly recordsProviderService: RecordsProvidersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly imgService: ImgService,
  ) {}

  private emitQueueEvent(id: number, action: UpdateQueuePayload['action']) {
    this.eventEmitter.emit(WsEvents.UPDATE_QUEUE, { id, action } satisfies UpdateQueuePayload)
  }

  private emitSuggestionsEvent(id: number, action: UpdateSuggestionsPayload['action']) {
    this.eventEmitter.emit(WsEvents.UPDATE_SUGGESTIONS, {
      id,
      action,
    } satisfies UpdateSuggestionsPayload)
  }

  private emitRecordsEvent(
    id: number,
    genre: RecordGenre | undefined,
    action: UpdateRecordsPayload['action'],
  ) {
    this.eventEmitter.emit(WsEvents.UPDATE_RECORDS, {
      genre,
      id,
      action,
    } satisfies UpdateRecordsPayload)
  }

  async createRecordFromLink(data: RecordCreateFromLinkDTO): Promise<RecordEntity> {
    this.logger.log(`Creating record from link link=${data.link}`)
    const preparedData = await this.recordsProviderService.prepareData({
      link: data.link,
    })

    const createdData = await this.recordRepository.create({
      ...preparedData,
      status: data.status || RecordStatus.QUEUE,
      type: data.type || RecordType.WRITTEN,
    })

    if (createdData.status === RecordStatus.QUEUE && createdData.type === RecordType.WRITTEN)
      this.emitQueueEvent(createdData.id, 'created')
    if (createdData.type === RecordType.SUGGESTION)
      this.emitSuggestionsEvent(createdData.id, 'created')
    this.logger.log(
      `Record created id=${createdData.id} type=${createdData.type} status=${createdData.status}`,
    )
    return createdData as RecordEntity
  }

  async patchRecord(id: number, data: RecordUpdateDTO): Promise<RecordEntity> {
    this.logger.log(`Patching record id=${id}`)
    const foundedRecord = await this.recordRepository.findById(id)
    if (!foundedRecord) {
      throw new NotFoundException('Record not found')
    }
    const updatedRecord = await this.recordRepository.update(id, data)

    if (
      foundedRecord.type === RecordType.SUGGESTION &&
      updatedRecord.type !== RecordType.SUGGESTION
    ) {
      this.emitSuggestionsEvent(updatedRecord.id, 'updated')
    }

    if (
      (foundedRecord.status === RecordStatus.QUEUE &&
        updatedRecord.status !== RecordStatus.QUEUE) ||
      (updatedRecord.status === RecordStatus.QUEUE && updatedRecord.type === RecordType.WRITTEN) ||
      (foundedRecord.type === RecordType.WRITTEN && updatedRecord.type !== RecordType.WRITTEN)
    ) {
      this.emitQueueEvent(updatedRecord.id, 'updated')
    }

    this.emitRecordsEvent(updatedRecord.id, updatedRecord.genre, 'updated')
    this.logger.log(`Record patched id=${id}`)
    return updatedRecord as RecordEntity
  }

  async updatePoster(id: number, url: string): Promise<RecordEntity> {
    this.logger.log(`Updating poster for record id=${id}`)
    const record = await this.recordRepository.findById(id)
    if (!record) {
      throw new NotFoundException('Record not found')
    }

    const urlBase64 = Buffer.from(unescape(encodeURIComponent(url))).toString('base64')
    await this.imgService.getImageContent(urlBase64)

    const updatedRecord = await this.recordRepository.update(id, { posterUrl: url })

    this.emitRecordsEvent(updatedRecord.id, updatedRecord.genre, 'updated')

    this.logger.log(`Poster updated for record id=${id}`)
    return updatedRecord as RecordEntity
  }

  async deleteRecord(id: number): Promise<void> {
    this.logger.log(`Deleting record id=${id}`)
    const foundedRecord = await this.recordRepository.findById(id)

    if (!foundedRecord) {
      throw new NotFoundException('Record not found')
    }

    await this.recordRepository.delete(id)

    if (foundedRecord.type === RecordType.SUGGESTION) {
      this.emitSuggestionsEvent(foundedRecord.id, 'deleted')
    }

    if (foundedRecord.status === RecordStatus.QUEUE && foundedRecord.type === RecordType.WRITTEN) {
      this.emitQueueEvent(foundedRecord.id, 'deleted')
    }
    this.emitRecordsEvent(foundedRecord.id, foundedRecord.genre, 'deleted')
    this.logger.log(`Record deleted id=${id}`)
  }

  async getAllRecords(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string
      status?: RecordStatus[]
      type?: RecordType
      grade?: RecordGrade[]
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
      genre: filters?.genre,
    }
    const sortOptions = { orderBy, direction }

    const [total, records] = await Promise.all([
      this.recordRepository.count(filterOptions),
      this.recordRepository.findAll(filterOptions, sortOptions, { skip, take: limit }),
    ])

    return { records: records as RecordEntity[], total }
  }

  async findRecordById(id: number): Promise<RecordEntity> {
    const record = await this.recordRepository.findById(id)
    if (!record) {
      throw new NotFoundException('Record not found')
    }
    return record as RecordEntity
  }
}
