import { Injectable } from '@nestjs/common'
import { $Enums, User } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async upsertUser(
    id: string,
    login: string,
    role: $Enums.PrismaRoles,
  ): Promise<User> {
    const foundUser = await this.prisma.user.findUnique({ where: { id } })
    if (!foundUser) {
      return this.prisma.user.create({ data: { id, login, role } })
    } else {
      return foundUser
    }
  }

  async getUserById(id: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany()
  }
}
