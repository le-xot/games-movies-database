import { index, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { recordGenreEnum, recordGradeEnum, recordStatusEnum, recordTypeEnum } from './enums'

export const records = pgTable(
  'records',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    link: text('link').notNull(),
    posterUrl: text('posterUrl').notNull(),
    status: recordStatusEnum('status').default('QUEUE'),
    type: recordTypeEnum('type').default('WRITTEN'),
    genre: recordGenreEnum('genre'),
    grade: recordGradeEnum('grade'),
    episode: text('episode'),
    createdAt: timestamp('createdAt', { precision: 3 }).default(currentTimestamp).notNull(),
    extra: jsonb('extra'),
  },
  (table) => [index('records_title_idx').on(table.title)],
)
