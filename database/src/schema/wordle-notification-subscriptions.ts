import {
  boolean,
  foreignKey,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { users } from './users'

export const wordleNotificationSubscriptions = pgTable(
  'wordle_notification_subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull(),
    chatId: text('chatId').notNull(),
    telegramUsername: text('telegramUsername'),
    morningEnabled: boolean('morningEnabled').default(true).notNull(),
    eveningEnabled: boolean('eveningEnabled').default(true).notNull(),
    createdAt: timestamp('createdAt', { precision: 3 }).default(currentTimestamp).notNull(),
  },
  (table) => [
    uniqueIndex('wordle_notification_subscriptions_userId_key').on(table.userId),
    uniqueIndex('wordle_notification_subscriptions_chatId_key').on(table.chatId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'wordle_notification_subscriptions_userid_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
)
