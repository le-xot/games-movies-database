import { Injectable } from '@nestjs/common'
import { $Enums, User } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async upsertUser(
    opts: {
      id: string
      login?: string
      role?: $Enums.PrismaRoles
      profileImageUrl?: string
    },
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { id: opts.id },
      update: {
        login: opts.login,
        role: opts.role,
        profileImageUrl: opts.profileImageUrl,
      },
      create: {
        id: opts.id,
        login: opts.login,
        role: $Enums.PrismaRoles.USER,
        profileImageUrl: opts.profileImageUrl,
      },
    })
  }

  async getUserById(id: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany()
  }

  async deleteUserById(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }
}
