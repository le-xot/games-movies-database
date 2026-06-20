import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import { CreateUserData, LinkPlatformData, UpdateUserData, UserRepository } from './user.repository'

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
    return await this.prisma.user.findFirst({ where: { login } })
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
      await tx.suggestionOwnership.deleteMany({ where: { userId } })
      await tx.user.delete({ where: { id: userId } })
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

  async unlinkPlatformAccount(userId: string, platform: string): Promise<void> {
    await this.prisma.userAccount.delete({
      where: {
        userId_platform: { userId, platform: platform as any },
      },
    })
  }

  findAccountsByUserId(userId: string) {
    return this.prisma.userAccount.findMany({
      where: { userId },
    })
  }
}
