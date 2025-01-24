import { Injectable, NotFoundException } from '@nestjs/common'
import { $Enums, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { CreateVideoDTO, PatchVideoDTO } from './video.dto'
import { VideoEntity } from './video.entity'

@Injectable()
export class VideoServices {
  constructor(private prisma: PrismaService) {}

  async createVideo(video: CreateVideoDTO): Promise<VideoEntity> {
    return this.prisma.video.create({
      data: video,
      include: {
        person: true,
      },
    })
  }

  async patchVideo(id: number, video: PatchVideoDTO): Promise<VideoEntity> {
    const foundedVideo = await this.prisma.video.findUnique({
      where: { id },
    })
    if (!foundedVideo) {
      throw new NotFoundException('Video not found')
    }
    return this.prisma.video.update({
      where: { id },
      include: { person: true },
      data: { ...foundedVideo, ...video },
    })
  }

  async deleteVideo(id: number): Promise<void> {
    await this.prisma.video.delete({ where: { id } })
  }

  async getAllVideos(
    page: number = 1,
    limit: number = 10,
    filters?: {
      title?: string
      personId?: number
      type?: $Enums.PrismaTypes
      status?: $Enums.PrismaStatuses
      genre?: $Enums.PrismaGenres
      grade?: $Enums.PrismaGrades
    },
    orderBy?: 'title' | 'id',
    direction?: 'asc' | 'desc',
  ): Promise<{ videos: VideoEntity[], total: number }> {
    const skip = (page - 1) * limit

    const where: Prisma.VideoWhereInput = {}

    if (filters?.title) {
      where.title = {
        contains: filters.title,
        mode: Prisma.QueryMode.insensitive,
      }
    }
    if (filters?.personId) {
      where.personId = filters.personId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.grade) {
      where.grade = filters.grade
    }

    if (filters?.genre) {
      where.genre = filters.genre
    }

    const total = await this.prisma.video.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    const videos = await this.prisma.video.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { person: true },
      orderBy: {
        [orderBy || 'id']: direction || 'asc',
      },
      skip,
      take: limit,
    })

    return { videos, total }
  }

  async findVideoById(id: number): Promise<VideoEntity> {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        person: true,
      },
    })
    if (!video) {
      throw new NotFoundException('Video not found')
    }
    return video
  }
}
