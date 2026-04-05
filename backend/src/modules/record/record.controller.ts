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
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { User } from '@/modules/auth/auth.user.decorator'
import {
  GetAllRecordsDTO,
  RecordCreateFromLinkDTO,
  RecordGetDTO,
  RecordUpdateDTO,
} from '@/modules/record/record.dto'
import { RecordEntity } from '@/modules/record/record.entity'
import { RecordService } from '@/modules/record/record.service'
import { UserEntity } from '@/modules/user/user.entity'

@ApiTags('records')
@Controller('records')
export class RecordController {
  constructor(private recordServices: RecordService) {}

  @Post('link')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: 201, type: RecordEntity })
  async createRecordFromLink(
    @User() user: UserEntity,
    @Body() data: RecordCreateFromLinkDTO,
  ): Promise<RecordEntity> {
    return await this.recordServices.createRecordFromLink(user, data)
  }

  @Post()
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
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: RecordEntity })
  async patchRecord(@Param('id') id: number, @Body() record: RecordUpdateDTO): Promise<RecordEntity> {
    return await this.recordServices.patchRecord(id, record)
  }

  @Delete(':id')
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
