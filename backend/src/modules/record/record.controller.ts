import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { User } from '../auth/auth.user.decorator'
import { UserEntity } from '../user/user.entity'
import { GetAllRecordsDTO, RecordCreateFromLinkDTO, RecordGetDTO, RecordUpdateDTO } from './record.dto'
import { RecordEntity } from './record.entity'
import { RecordService } from './record.service'

@ApiTags('records')
@Controller('records')
export class RecordController {
  private readonly logger = new Logger(RecordController.name)

  constructor(private recordServices: RecordService) {}

  @Post('link')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 201, type: RecordEntity })
  createRecordFromLink(
    @User() user: UserEntity,
    @Body() data: RecordCreateFromLinkDTO,
  ): Promise<RecordEntity> {
    this.logger.log(`createRecordFromLink user=${user.id} link=${data.link}`)
    return this.recordServices.createRecordFromLink(user, data)
  }

  @Post()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 201, type: RecordEntity })
  createRecord(@Body() id: number, record: RecordUpdateDTO): Promise<RecordEntity> {
    return this.recordServices.patchRecord(id, record)
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: RecordEntity })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async findRecordById(@Param('id') id: number): Promise<RecordEntity> {
    this.logger.log(`findRecordById id=${id}`)
    const record = await this.recordServices.findRecordById(id)
    if (!record) {
      throw new NotFoundException('Record not found')
    }
    return record
  }

  @Patch(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: RecordEntity })
  patchRecord(
    @Param('id') id: number,
    @Body() record: RecordUpdateDTO,
  ): Promise<RecordEntity> {
    this.logger.log(`patchRecord id=${id}`)
    return this.recordServices.patchRecord(id, record)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 204 })
  async deleteRecord(@Param('id') id: number): Promise<void> {
    this.logger.log(`deleteRecord id=${id}`)
    await this.recordServices.deleteRecord(id)
  }

  @Get()
  @ApiResponse({ status: 200, type: GetAllRecordsDTO })
  async getAllRecords(@Query() query: RecordGetDTO): Promise<GetAllRecordsDTO> {
    const { page, limit, orderBy, direction, ...filters } = query
    this.logger.log(`getAllRecords query=${JSON.stringify(query)}`)
    return await this.recordServices.getAllRecords(page, limit, filters, orderBy, direction)
  }
}
