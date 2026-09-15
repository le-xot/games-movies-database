import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { thirdPartServiceEnum } from './enums'

export const thirdPartyOauthServiceTokens = pgTable(
  'third_part_oauth_service_tokens',
  {
    id: serial('id').primaryKey(),
    service: thirdPartServiceEnum('service').notNull(),
    accessToken: text('accessToken').notNull(),
    refreshToken: text('refreshToken').notNull(),
    obtainedAt: timestamp('obtainedAt', { precision: 3 }).default(currentTimestamp).notNull(),
    expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
  },
  (table) => [uniqueIndex('third_part_oauth_service_tokens_service_key').on(table.service)],
)
