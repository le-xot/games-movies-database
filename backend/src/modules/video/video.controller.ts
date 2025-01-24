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
import { CreateVideoDTO, GetVideoDTO, PatchVideoDTO } from './video.dto'
import { VideoEntity } from './video.entity'
import { VideoServices } from './video.service'

@ApiTags('videos')
@Controller('videos')
export class VideoController {
  constructor(private videoServices: VideoServices) {}

  @Post()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 201, type: VideoEntity })
  async createVideo(@Body() video: CreateVideoDTO): Promise<VideoEntity> {
    return this.videoServices.createVideo(video)
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 200, type: VideoEntity })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async findVideoById(@Param('id') id: number): Promise<VideoEntity> {
    const video = await this.videoServices.findVideoById(id)
    if (!video) {
      throw new NotFoundException('Video not found')
    }
    return video
  }

  @Patch(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 200, type: VideoEntity })
  async patchVideo(
    @Param('id') id: number,
    @Body() video: PatchVideoDTO,
  ): Promise<VideoEntity> {
    return this.videoServices.patchVideo(id, video)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 204 })
  async deleteVideo(@Param('id') id: number): Promise<void> {
    await this.videoServices.deleteVideo(id)
  }

  @Get()
  @ApiResponse({ status: 200, type: VideoEntity, isArray: true })
  async getAllVideos(@Query() query: GetVideoDTO): Promise<{ videos: VideoEntity[], total: number }> {
    const { page, limit, orderBy, direction, ...filters } = query
    const { videos, total } = await this.videoServices.getAllVideos(page, limit, filters, orderBy, direction)
    return { videos, total }
  }
}
