import { Injectable } from '@nestjs/common'
import { PrismaRoles, User } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class UserServices {
  constructor(private prisma: PrismaService) {}

  async upsertUser(
    login: string,
    twitchId: string,
    role: PrismaRoles,
  ): Promise<User> {
    const foundUser = await this.prisma.user.findUnique({ where: { twitchId } })
    if (!foundUser) {
      return this.prisma.user.create({ data: { login, twitchId, role } })
    } else {
      return foundUser
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany()
  }

  async deleteAll(): Promise<void> {
    this.prisma.user.deleteMany({})
  }
}
