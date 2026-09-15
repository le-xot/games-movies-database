import { pgEnum } from 'drizzle-orm/pg-core'

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]
export const userRoleEnum = pgEnum('UserRole', [UserRole.USER, UserRole.ADMIN])

export const RecordStatus = {
  QUEUE: 'QUEUE',
  PROGRESS: 'PROGRESS',
  DROP: 'DROP',
  NOTINTERESTED: 'NOTINTERESTED',
  UNFINISHED: 'UNFINISHED',
  DONE: 'DONE',
} as const
export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus]
export const recordStatusEnum = pgEnum('RecordStatus', [
  RecordStatus.QUEUE,
  RecordStatus.PROGRESS,
  RecordStatus.DROP,
  RecordStatus.UNFINISHED,
  RecordStatus.DONE,
  RecordStatus.NOTINTERESTED,
])

export const RecordType = {
  WRITTEN: 'WRITTEN',
  SUGGESTION: 'SUGGESTION',
  ORDER: 'ORDER',
} as const
export type RecordType = (typeof RecordType)[keyof typeof RecordType]
export const recordTypeEnum = pgEnum('RecordType', [
  RecordType.WRITTEN,
  RecordType.SUGGESTION,
  RecordType.ORDER,
])

export const RecordGenre = {
  GAME: 'GAME',
  MOVIE: 'MOVIE',
  ANIME: 'ANIME',
  CARTOON: 'CARTOON',
  SERIES: 'SERIES',
} as const
export type RecordGenre = (typeof RecordGenre)[keyof typeof RecordGenre]
export const recordGenreEnum = pgEnum('RecordGenre', [
  RecordGenre.GAME,
  RecordGenre.MOVIE,
  RecordGenre.ANIME,
  RecordGenre.CARTOON,
  RecordGenre.SERIES,
])

export const RecordGrade = {
  DISLIKE: 'DISLIKE',
  BEER: 'BEER',
  LIKE: 'LIKE',
  RECOMMEND: 'RECOMMEND',
} as const
export type RecordGrade = (typeof RecordGrade)[keyof typeof RecordGrade]
export const recordGradeEnum = pgEnum('RecordGrade', [
  RecordGrade.DISLIKE,
  RecordGrade.BEER,
  RecordGrade.LIKE,
  RecordGrade.RECOMMEND,
])

export const LimitType = {
  SUGGESTION: 'SUGGESTION',
} as const
export type LimitType = (typeof LimitType)[keyof typeof LimitType]
export const limitTypeEnum = pgEnum('LimitType', [LimitType.SUGGESTION])

export const ThirdPartService = {
  SPOTIFY: 'SPOTIFY',
} as const
export type ThirdPartService = (typeof ThirdPartService)[keyof typeof ThirdPartService]
export const thirdPartServiceEnum = pgEnum('ThirdPartService', [ThirdPartService.SPOTIFY])

export const platformEnum = pgEnum('Platform', ['TWITCH', 'KICK', 'TELEGRAM'])
