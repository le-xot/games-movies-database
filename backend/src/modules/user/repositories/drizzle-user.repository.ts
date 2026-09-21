import crypto from 'node:crypto'
import { likes, suggestionOwnerships, userAccounts, users, wordleGames } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { AccountPlatform, UserRole } from '@/enums'
import {
  CreateUserData,
  LinkPlatformData,
  MergeUsersResult,
  UpdateUserData,
  UserDomain,
} from '@/modules/user/entities/user-domain.entity'

@Injectable()
export class DrizzleUserRepository {
  constructor(private readonly drizzle: DrizzleService) {}

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

  async findById(id: string): Promise<UserDomain | null> {
    return (await this.drizzle.db.query.users.findFirst({ where: eq(users.id, id) })) ?? null
  }

  async findByLogin(login: string): Promise<UserDomain | null> {
    return (
      (await this.drizzle.db.query.users.findFirst({
        where: sql`lower(${users.login}) = ${login.trim().toLowerCase()}`,
      })) ?? null
    )
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
    const values = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as UpdateUserData
    if (Object.keys(values).length === 0) {
      return await this.findById(id)
    }
    const [user] = await this.drizzle.db
      .update(users)
      .set(values)
      .where(eq(users.id, id))
      .returning()
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

  async unlinkPlatformAccount(userId: string, platform: AccountPlatform): Promise<void> {
    await this.drizzle.db
      .delete(userAccounts)
      .where(and(eq(userAccounts.userId, userId), eq(userAccounts.platform, platform)))
  }

  async findAccountsByUserId(userId: string) {
    return await this.drizzle.db.query.userAccounts.findMany({
      where: eq(userAccounts.userId, userId),
    })
  }

  async mergeUsers(targetId: string, sourceId: string): Promise<MergeUsersResult> {
    return await this.drizzle.db.transaction(async (tx) => {
      const mergedUsers = await tx
        .select()
        .from(users)
        .where(inArray(users.id, [targetId, sourceId]))
      const targetUser = mergedUsers.find((user) => user.id === targetId)
      const sourceUser = mergedUsers.find((user) => user.id === sourceId)

      const targetAccounts = await tx
        .select({ platform: userAccounts.platform })
        .from(userAccounts)
        .where(eq(userAccounts.userId, targetId))
      const sourceAccounts = await tx
        .select({ id: userAccounts.id, platform: userAccounts.platform })
        .from(userAccounts)
        .where(eq(userAccounts.userId, sourceId))

      const targetPlatforms = new Set(targetAccounts.map((account) => account.platform))
      const conflictingAccounts = sourceAccounts.filter((account) =>
        targetPlatforms.has(account.platform),
      )
      const accountsToMove = sourceAccounts.filter(
        (account) => !targetPlatforms.has(account.platform),
      )

      if (conflictingAccounts.length > 0) {
        await tx.delete(userAccounts).where(
          inArray(
            userAccounts.id,
            conflictingAccounts.map((account) => account.id),
          ),
        )
      }
      if (accountsToMove.length > 0) {
        await tx
          .update(userAccounts)
          .set({ userId: targetId })
          .where(
            inArray(
              userAccounts.id,
              accountsToMove.map((account) => account.id),
            ),
          )
      }

      const targetLikes = await tx
        .select({ recordId: likes.recordId })
        .from(likes)
        .where(eq(likes.userId, targetId))
      const sourceLikes = await tx
        .select({ id: likes.id, recordId: likes.recordId })
        .from(likes)
        .where(eq(likes.userId, sourceId))

      const likedRecordIds = new Set(targetLikes.map((like) => like.recordId))
      const duplicateLikes = sourceLikes.filter((like) => likedRecordIds.has(like.recordId))
      const likesToMove = sourceLikes.filter((like) => !likedRecordIds.has(like.recordId))

      if (duplicateLikes.length > 0) {
        await tx.delete(likes).where(
          inArray(
            likes.id,
            duplicateLikes.map((like) => like.id),
          ),
        )
      }
      if (likesToMove.length > 0) {
        await tx
          .update(likes)
          .set({ userId: targetId })
          .where(
            inArray(
              likes.id,
              likesToMove.map((like) => like.id),
            ),
          )
      }

      const movedSuggestions = await tx
        .update(suggestionOwnerships)
        .set({ userId: targetId })
        .where(eq(suggestionOwnerships.userId, sourceId))
        .returning({ id: suggestionOwnerships.id })

      const targetGames = await tx
        .select({ date: wordleGames.date })
        .from(wordleGames)
        .where(eq(wordleGames.userId, targetId))
      const sourceGames = await tx
        .select({ id: wordleGames.id, date: wordleGames.date })
        .from(wordleGames)
        .where(eq(wordleGames.userId, sourceId))

      const playedDates = new Set(targetGames.map((game) => game.date))
      const duplicateGames = sourceGames.filter((game) => playedDates.has(game.date))
      const gamesToMove = sourceGames.filter((game) => !playedDates.has(game.date))

      if (duplicateGames.length > 0) {
        await tx.delete(wordleGames).where(
          inArray(
            wordleGames.id,
            duplicateGames.map((game) => game.id),
          ),
        )
      }
      if (gamesToMove.length > 0) {
        await tx
          .update(wordleGames)
          .set({ userId: targetId })
          .where(
            inArray(
              wordleGames.id,
              gamesToMove.map((game) => game.id),
            ),
          )
      }

      if (sourceUser?.role === UserRole.ADMIN && targetUser?.role !== UserRole.ADMIN) {
        await tx.update(users).set({ role: UserRole.ADMIN }).where(eq(users.id, targetId))
      }

      await tx.delete(users).where(eq(users.id, sourceId))

      return {
        accountsMoved: accountsToMove.length,
        accountsDropped: conflictingAccounts.length,
        likesMoved: likesToMove.length,
        likesDropped: duplicateLikes.length,
        suggestionsMoved: movedSuggestions.length,
        wordleGamesMoved: gamesToMove.length,
        wordleGamesDropped: duplicateGames.length,
      }
    })
  }
}
