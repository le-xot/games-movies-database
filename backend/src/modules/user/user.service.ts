import { Injectable } from '@nestjs/common'
import { $Enums, User } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  upsertUser(
    id: string,
    data: {
      login?: string
      role?: $Enums.UserRole
      profileImageUrl?: string
      color?: string
    },
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { id },
      update: {
        login: data.login,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        color: data.color,
      },
      create: {
        id,
        login: data.login,
        role: $Enums.UserRole.USER,
        profileImageUrl: data.profileImageUrl,
        color: data.color || '#333333',
      },
    })
  }

  getUserByLogin(login: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { login } })
  }

  getUserById(id: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany()
  }

  async deleteUserByLogin(login: string): Promise<void> {
    await this.prisma.user.delete({ where: { login } })
  }

  async deleteUserById(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }
}
