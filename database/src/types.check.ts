import type { InsertRows, SelectRow, SelectRows, TableName } from './types'

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Expect<T extends true> = T

/** Only real tables are discovered: 9 tables, no enums/relations/defaults. */
export type TableNames = Expect<
  Equals<
    TableName,
    | 'likes'
    | 'limits'
    | 'records'
    | 'suggestionOwnerships'
    | 'suggestionRules'
    | 'userAccounts'
    | 'users'
    | 'wordleGames'
    | 'wordleNotificationSubscriptions'
  >
>

declare const record: SelectRows['records']
export const recordTitle: string = record.title
export const recordGrade: 'DISLIKE' | 'BEER' | 'LIKE' | 'RECOMMEND' | null = record.grade

declare const account: InsertRows['userAccounts']
export const accountPlatform: 'TWITCH' | 'KICK' | 'TELEGRAM' = account.platform

// @ts-expect-error enums and relations are not tables
export type NotATable = SelectRow<'RecordGenre'>
// @ts-expect-error unknown table names are rejected
export type UnknownTable = SelectRow<'nope'>
