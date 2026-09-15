import { boolean, index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { userRoleEnum } from './enums'

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    login: text('login').notNull(),
    role: userRoleEnum('role').default('USER').notNull(),
    profileImageUrl: text('profileImageUrl').notNull(),
    color: text('color').default('#333333').notNull(),
    createdAt: timestamp('createdAt', { precision: 3 }).default(currentTimestamp).notNull(),
    hasCustomAvatar: boolean('hasCustomAvatar').default(false).notNull(),
  },
  (table) => [uniqueIndex('users_id_key').on(table.id), index('users_login_idx').on(table.login)],
)
