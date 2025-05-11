import {
  Body,
  Controller,
  Delete,
  Get,
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
import { GetAllRecordsDTO, RecordGetDTO, RecordUpsertDTO } from './record.dto'
import { RecordEntity } from './record.entity'
import { RecordService } from './record.service'

@ApiTags('records')
@Controller('records')
export class RecordController {
  constructor(private recordServices: RecordService) {}

  @Post()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 201, type: RecordEntity })
  createRecord(@Body() record: RecordUpsertDTO): Promise<RecordEntity> {
    return this.recordServices.createRecord(record)
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: RecordEntity })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async findRecordById(@Param('id') id: number): Promise<RecordEntity> {
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
    @Body() record: RecordUpsertDTO,
  ): Promise<RecordEntity> {
    return this.recordServices.patchRecord(id, record)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 204 })
  async deleteRecord(@Param('id') id: number): Promise<void> {
    await this.recordServices.deleteRecord(id)
  }

  @Get()
  @ApiResponse({ status: 200, type: GetAllRecordsDTO })
  async getAllRecords(@Query() query: RecordGetDTO): Promise<GetAllRecordsDTO> {
    const { page, limit, orderBy, direction, ...filters } = query
    return await this.recordServices.getAllRecords(page, limit, filters, orderBy, direction)
  }
}
