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
import { Throttle } from '@nestjs/throttler'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import {
  GetAllRecordsDTO,
  RecordCreateFromLinkDTO,
  RecordGetDTO,
  RecordUpdateDTO,
  RecordUpdatePosterDTO,
} from '@/modules/record/record.dto'
import { RecordEntity } from '@/modules/record/record.entity'
import { RecordService } from '@/modules/record/record.service'
import { THROTTLER_LIMITS } from '@/utils/throttler'

@ApiTags('records')
@Controller('records')
export class RecordController {
  constructor(private recordServices: RecordService) {}

  @Post('link')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: 201, type: RecordEntity })
  async createRecordFromLink(@Body() data: RecordCreateFromLinkDTO): Promise<RecordEntity> {
    return await this.recordServices.createRecordFromLink(data)
  }

  @Post()
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: 201, type: RecordEntity })
  async createRecord(@Body() id: number, record: RecordUpdateDTO): Promise<RecordEntity> {
    return await this.recordServices.patchRecord(id, record)
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
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
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: RecordEntity })
  async patchRecord(
    @Param('id') id: number,
    @Body() record: RecordUpdateDTO,
  ): Promise<RecordEntity> {
    return await this.recordServices.patchRecord(id, record)
  }

  @Patch(':id/poster')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: RecordEntity })
  async updatePoster(
    @Param('id') id: number,
    @Body() data: RecordUpdatePosterDTO,
  ): Promise<RecordEntity> {
    return await this.recordServices.updatePoster(id, data.url)
  }

  @Delete(':id')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
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
