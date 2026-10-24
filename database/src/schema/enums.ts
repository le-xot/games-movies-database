import {
  AccountPlatform,
  LimitType,
  RecordGenre,
  RecordGrade,
  RecordStatus,
  RecordType,
  UserRole,
  WordleGameStatus,
} from '@gmdb/contract'
import { pgEnum } from 'drizzle-orm/pg-core'

export {
  AccountPlatform,
  LimitType,
  RecordGenre,
  RecordGrade,
  RecordStatus,
  RecordType,
  UserRole,
  WordleGameStatus,
}

export const userRoleEnum = pgEnum('UserRole', [UserRole.USER, UserRole.ADMIN])

export const recordStatusEnum = pgEnum('RecordStatus', [
  RecordStatus.QUEUE,
  RecordStatus.PROGRESS,
  RecordStatus.DROP,
  RecordStatus.UNFINISHED,
  RecordStatus.DONE,
  RecordStatus.NOTINTERESTED,
])

export const recordTypeEnum = pgEnum('RecordType', [
  RecordType.WRITTEN,
  RecordType.SUGGESTION,
  RecordType.ORDER,
])

export const recordGenreEnum = pgEnum('RecordGenre', [
  RecordGenre.GAME,
  RecordGenre.MOVIE,
  RecordGenre.ANIME,
  RecordGenre.CARTOON,
  RecordGenre.SERIES,
])

export const recordGradeEnum = pgEnum('RecordGrade', [
  RecordGrade.DISLIKE,
  RecordGrade.BEER,
  RecordGrade.LIKE,
  RecordGrade.RECOMMEND,
])

export const limitTypeEnum = pgEnum('LimitType', [LimitType.SUGGESTION])

export const platformEnum = pgEnum('Platform', [
  AccountPlatform.TWITCH,
  AccountPlatform.KICK,
  AccountPlatform.TELEGRAM,
])

export const wordleGameStatusEnum = pgEnum('WordleGameStatus', [
  WordleGameStatus.IN_PROGRESS,
  WordleGameStatus.WON,
  WordleGameStatus.LOST,
])
