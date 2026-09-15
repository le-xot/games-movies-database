import crypto from 'node:crypto'
import { likes, suggestionOwnerships, userAccounts, users } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import { CreateUserData, LinkPlatformData, UpdateUserData, UserRepository } from './user.repository'

@Injectable()
export class DrizzleUserRepository extends UserRepository {
  constructor(private readonly drizzle: DrizzleService) {
    super()
  }

  async findByPlatformId(platform: string, platformUserId: string): Promise<UserDomain | null> {
    const account = await this.drizzle.db.query.userAccounts.findFirst({
      where: and(
        eq(userAccounts.platform, platform as any),
        eq(userAccounts.platformUserId, platformUserId),
      ),
      with: { user: true },
    })
    return account?.user ?? null
  }

  async findByLogin(login: string): Promise<UserDomain | null> {
    return (await this.drizzle.db.query.users.findFirst({ where: eq(users.login, login) })) ?? null
  }

  async findById(id: string): Promise<UserDomain | null> {
    return (await this.drizzle.db.query.users.findFirst({ where: eq(users.id, id) })) ?? null
  }

  async create(data: CreateUserData): Promise<UserDomain> {
    return await this.drizzle.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          login: data.login,
          role: data.role,
          profileImageUrl: data.profileImageUrl,
          color: data.color,
        })
        .returning()

      await tx.insert(userAccounts).values({
        userId: user.id,
        platform: data.platform as any,
        platformUserId: data.platformUserId,
        platformLogin: data.platformLogin,
        platformAvatar: data.platformAvatar,
      })

      return user
    })
  }

  async update(id: string, data: UpdateUserData): Promise<UserDomain> {
    const [user] = await this.drizzle.db.update(users).set(data).where(eq(users.id, id)).returning()
    return user
  }

  async findAll(): Promise<UserDomain[]> {
    return await this.drizzle.db.select().from(users)
  }

  async deleteWithCascade(userId: string): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      await tx.delete(likes).where(eq(likes.userId, userId))
      await tx.delete(suggestionOwnerships).where(eq(suggestionOwnerships.userId, userId))
      await tx.delete(users).where(eq(users.id, userId))
    })
  }

  async linkPlatformAccount(userId: string, data: LinkPlatformData): Promise<void> {
    await this.drizzle.db.insert(userAccounts).values({
      userId,
      platform: data.platform as any,
      platformUserId: data.platformUserId,
      platformLogin: data.platformLogin,
      platformAvatar: data.platformAvatar,
    })
  }

  async unlinkPlatformAccount(userId: string, platform: string): Promise<void> {
    await this.drizzle.db
      .delete(userAccounts)
      .where(and(eq(userAccounts.userId, userId), eq(userAccounts.platform, platform as any)))
  }

  async findAccountsByUserId(userId: string) {
    return await this.drizzle.db.query.userAccounts.findMany({
      where: eq(userAccounts.userId, userId),
    })
  }
}
