/**
 * Общие значения бэкенда и фронта.
 *
 * Ни одной зависимости: этот файл попадает в бандл фронта, поэтому здесь не
 * должно быть ни `drizzle-orm`, ни `elysia`, ни чего-либо ещё. Консты — не
 * TS-enum'ы, чтобы значение и тип жили под одним именем:
 *
 * ```ts
 * import { RecordGenre, type RecordGenre } from '@gmdb/contract'
 * const genre: RecordGenre = RecordGenre.GAME
 * ```
 */

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const RecordStatus = {
  QUEUE: 'QUEUE',
  PROGRESS: 'PROGRESS',
  DROP: 'DROP',
  NOTINTERESTED: 'NOTINTERESTED',
  UNFINISHED: 'UNFINISHED',
  DONE: 'DONE',
} as const
export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus]

export const RecordType = {
  WRITTEN: 'WRITTEN',
  SUGGESTION: 'SUGGESTION',
  ORDER: 'ORDER',
} as const
export type RecordType = (typeof RecordType)[keyof typeof RecordType]

export const RecordGenre = {
  GAME: 'GAME',
  MOVIE: 'MOVIE',
  ANIME: 'ANIME',
  CARTOON: 'CARTOON',
  SERIES: 'SERIES',
} as const
export type RecordGenre = (typeof RecordGenre)[keyof typeof RecordGenre]

export const RecordGrade = {
  DISLIKE: 'DISLIKE',
  BEER: 'BEER',
  LIKE: 'LIKE',
  RECOMMEND: 'RECOMMEND',
} as const
export type RecordGrade = (typeof RecordGrade)[keyof typeof RecordGrade]

export const LimitType = {
  SUGGESTION: 'SUGGESTION',
} as const
export type LimitType = (typeof LimitType)[keyof typeof LimitType]

export const AccountPlatform = {
  TWITCH: 'TWITCH',
  KICK: 'KICK',
  TELEGRAM: 'TELEGRAM',
} as const
export type AccountPlatform = (typeof AccountPlatform)[keyof typeof AccountPlatform]

export const WordleGameStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  WON: 'WON',
  LOST: 'LOST',
} as const
export type WordleGameStatus = (typeof WordleGameStatus)[keyof typeof WordleGameStatus]

export const WordleLetterState = {
  CORRECT: 'CORRECT',
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
} as const
export type WordleLetterState = (typeof WordleLetterState)[keyof typeof WordleLetterState]

export const WordleHistoryStatus = {
  WON: 'WON',
  LOST: 'LOST',
  NONE: 'NONE',
} as const
export type WordleHistoryStatus = (typeof WordleHistoryStatus)[keyof typeof WordleHistoryStatus]

/** Порядок сортировки списка записей. */
export const RecordOrderBy = {
  id: 'id',
  title: 'title',
} as const
export type RecordOrderBy = (typeof RecordOrderBy)[keyof typeof RecordOrderBy]

/** Направление сортировки списка записей. */
export const RecordDirection = {
  asc: 'asc',
  desc: 'desc',
} as const
export type RecordDirection = (typeof RecordDirection)[keyof typeof RecordDirection]

/** Вариант картинки в прокси `/api/img`. */
export const ImageVariant = {
  poster: 'poster',
  avatar: 'avatar',
} as const
export type ImageVariant = (typeof ImageVariant)[keyof typeof ImageVariant]
