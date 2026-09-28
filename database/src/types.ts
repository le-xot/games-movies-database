import type * as schema from './schema'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'

/** Schema exports that are actual tables (enums, relations and defaults are filtered out). */
type TableExports = {
  [K in keyof typeof schema as (typeof schema)[K] extends PgTable ? K : never]: (typeof schema)[K]
}

/** Union of table export names, e.g. 'records' | 'users' | ... */
export type TableName = keyof TableExports

/** Row shape returned by SELECT on a table (nullability included). */
export type SelectRow<T extends TableName> = InferSelectModel<TableExports[T]>

/** Shape accepted by INSERT on a table (defaults optional). */
export type InsertRow<T extends TableName> = InferInsertModel<TableExports[T]>

/** All table select shapes keyed by table name. */
export type SelectRows = { [K in TableName]: SelectRow<K> }

/** All table insert shapes keyed by table name. */
export type InsertRows = { [K in TableName]: InsertRow<K> }
