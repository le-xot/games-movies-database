import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { ProfileStatsDomain, UserDomain } from '@/modules/user/entities/user-domain.entity'
import { RecordEntity } from '@/modules/record/record.entity'
import {
  CreateUserData,
  LinkPlatformData,
  UpdateUserData,
  UserRepository,
} from './user.repository'

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByPlatformId(platform: string, platformUserId: string): Promise<UserDomain | null> {
    const account = await this.prisma.userAccount.findUnique({
      where: {
        platform_platformUserId: { platform: platform as any, platformUserId },
      },
      include: { user: true },
    })
    return account?.user ?? null
  }

  async findByLogin(login: string): Promise<UserDomain | null> {
    return await this.prisma.user.findUnique({ where: { login } })
  }

  async findById(id: string): Promise<UserDomain | null> {
    return await this.prisma.user.findUnique({ where: { id } })
  }

  async create(data: CreateUserData): Promise<UserDomain> {
    return await this.prisma.user.create({
      data: {
        login: data.login,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        color: data.color,
        accounts: {
          create: {
            platform: data.platform as any,
            platformUserId: data.platformUserId,
            platformLogin: data.platformLogin,
            platformAvatar: data.platformAvatar,
          },
        },
      },
    })
  }

  async update(id: string, data: UpdateUserData): Promise<UserDomain> {
    return await this.prisma.user.update({
      where: { id },
      data,
    })
  }

  async findAll(): Promise<UserDomain[]> {
    return await this.prisma.user.findMany()
  }

  async deleteWithCascade(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.like.deleteMany({ where: { userId } })
      await tx.record.updateMany({ where: { userId }, data: { userId: null } })
      await tx.user.delete({ where: { id: userId } })
    })
  }

  async getProfileStats(login: string): Promise<ProfileStatsDomain> {
    const [totalRecords, recordsByGenreRaw, gradeDistributionRaw, totalLikesReceived] =
      await Promise.all([
        this.prisma.record.count({ where: { user: { login } } }),
        this.prisma.record.groupBy({
          by: ['genre'],
          where: { user: { login } },
          _count: { genre: true },
        }),
        this.prisma.record.groupBy({
          by: ['grade'],
          where: { user: { login } },
          _count: { grade: true },
        }),
        this.prisma.like.count({ where: { record: { user: { login } } } }),
      ])

    return {
      totalRecords,
      recordsByGenre: recordsByGenreRaw.map((item) => ({
        genre: item.genre ?? 'UNKNOWN',
        count: item._count.genre,
      })),
      gradeDistribution: gradeDistributionRaw.map((item) => ({
        grade: item.grade ?? 'UNKNOWN',
        count: item._count.grade,
      })),
      totalLikesReceived,
    }
  }

  async getProfileStatsById(id: string): Promise<ProfileStatsDomain> {
    const [totalRecords, recordsByGenreRaw, gradeDistributionRaw, totalLikesReceived] =
      await Promise.all([
        this.prisma.record.count({ where: { userId: id } }),
        this.prisma.record.groupBy({
          by: ['genre'],
          where: { userId: id },
          _count: { genre: true },
        }),
        this.prisma.record.groupBy({
          by: ['grade'],
          where: { userId: id },
          _count: { grade: true },
        }),
        this.prisma.like.count({ where: { record: { userId: id } } }),
      ])

    return {
      totalRecords,
      recordsByGenre: recordsByGenreRaw.map((item) => ({
        genre: item.genre ?? 'UNKNOWN',
        count: item._count.genre,
      })),
      gradeDistribution: gradeDistributionRaw.map((item) => ({
        grade: item.grade ?? 'UNKNOWN',
        count: item._count.grade,
      })),
      totalLikesReceived,
    }
  }

  async getRecordsByLogin(login: string): Promise<RecordEntity[]> {
    return await this.prisma.record.findMany({
      where: { user: { login } },
      include: { user: true, likes: true },
    })
  }

  async getRecordsById(id: string): Promise<RecordEntity[]> {
    return await this.prisma.record.findMany({
      where: { user: { id } },
      include: { user: true, likes: true },
    })
  }

  async linkPlatformAccount(userId: string, data: LinkPlatformData): Promise<void> {
    await this.prisma.userAccount.create({
      data: {
        userId,
        platform: data.platform as any,
        platformUserId: data.platformUserId,
        platformLogin: data.platformLogin,
        platformAvatar: data.platformAvatar,
      },
    })
  }
}
