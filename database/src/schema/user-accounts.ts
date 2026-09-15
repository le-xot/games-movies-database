import { foreignKey, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { platformEnum } from './enums'
import { users } from './users'

export const userAccounts = pgTable(
  'user_accounts',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull(),
    platform: platformEnum('platform').notNull(),
    platformUserId: text('platformUserId').notNull(),
    platformLogin: text('platformLogin').notNull(),
    platformAvatar: text('platformAvatar'),
    createdAt: timestamp('createdAt', { precision: 3 }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_accounts_platform_platformUserId_key').on(
      table.platform,
      table.platformUserId,
    ),
    uniqueIndex('user_accounts_userId_platform_key').on(table.userId, table.platform),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'user_accounts_userId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
)
