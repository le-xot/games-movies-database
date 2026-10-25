import { index, jsonb, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { currentTimestamp } from './defaults'
import { recordGenreEnum, recordGradeEnum, recordStatusEnum, recordTypeEnum } from './enums'
import { isoTimestamp } from './timestamp'

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
    createdAt: isoTimestamp('createdAt').default(currentTimestamp).notNull(),
    updatedAt: isoTimestamp('updatedAt')
      .default(currentTimestamp)
      .notNull()
      .$onUpdate(() => currentTimestamp),
    extra: jsonb('extra').$type<Record<string, unknown> | null>(),
  },
  (table) => [index('records_title_idx').on(table.title)],
)
