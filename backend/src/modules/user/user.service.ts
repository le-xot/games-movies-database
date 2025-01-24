import { Injectable } from '@nestjs/common'
import { $Enums, User } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class UserServices {
  constructor(private prisma: PrismaService) {}

  async upsertUser(
    login: string,
    twitchId: string,
    role: $Enums.PrismaRoles,
  ): Promise<User> {
    const foundUser = await this.prisma.user.findUnique({ where: { twitchId } })
    if (!foundUser) {
      return this.prisma.user.create({ data: { login, twitchId, role } })
    } else {
      return foundUser
    }
  }

  async getUserByTwitchId(twitchId: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { twitchId } })
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany()
  }
}
