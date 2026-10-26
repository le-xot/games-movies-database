import { boolean, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { userRoleEnum } from './enums'
import { isoTimestamp } from './timestamp'

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    login: text('login').notNull(),
    role: userRoleEnum('role').default('USER').notNull(),
    profileImageUrl: text('profileImageUrl').notNull(),
    color: text('color').default('#333333').notNull(),
    createdAt: isoTimestamp('createdAt').default(currentTimestamp).notNull(),
    hasCustomAvatar: boolean('hasCustomAvatar').default(false).notNull(),
    // Косметика профиля: id из каталога `@gmdb/contract`, без FK — каталог живёт в коде.
    // `null` = без рамки / без бейджа.
    avatarFrameId: text('avatarFrameId'),
    // Открытые рамки-чекпоинты: условие достаточно выполнить один раз.
    unlockedAvatarFrameIds: text('unlockedAvatarFrameIds').array().notNull().default([]),
  },
  (table) => [uniqueIndex('users_id_key').on(table.id), index('users_login_idx').on(table.login)],
)
