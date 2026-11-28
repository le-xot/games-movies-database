import { describe, expect, test } from 'bun:test'
import { authModels } from '@backend/gateway/auth'
import { cocktailModels } from '@backend/gateway/cocktails'
import {
  AccountPlatform as AccountPlatformModel,
  LimitType as LimitTypeModel,
  RecordGenre as RecordGenreModel,
  RecordGrade as RecordGradeModel,
  RecordStatus as RecordStatusModel,
  RecordType as RecordTypeModel,
} from '@backend/gateway/models'
import { wordleModels } from '@backend/gateway/wordle'
import {
  cocktailMethodEnum,
  cocktailTierEnum,
  ingredientCategoryEnum,
  limitTypeEnum,
  platformEnum,
  recordGenreEnum,
  recordGradeEnum,
  recordStatusEnum,
  recordTypeEnum,
  userRoleEnum,
  wordleGameStatusEnum,
} from '@gmd/database/schema'
import {
  AccountPlatform,
  CocktailMethod,
  CocktailTier,
  IngredientCategory,
  LimitType,
  RecordGenre,
  RecordGrade,
  RecordStatus,
  RecordType,
  UserRole,
  WordleGameStatus,
  WordleHistoryStatus,
  WordleLetterState,
} from '@gmdb/contract'

/**
 * Инвариант SSOT для перечислений: значения объявлены в `@gmdb/contract`,
 * из них собираются TypeBox-схемы (валидация + типы фронта) и `pgEnum` (БД).
 * Тест ловит добавленное/переименованное значение, забытое в одном из трёх мест.
 */

type JsonSchema = { anyOf?: { const: string }[]; const?: string }

function schemaValues(schema: unknown): string[] {
  const value = schema as JsonSchema

  // TypeBox сворачивает union из одного элемента (`LimitType`) в литерал.
  return value.const ? [value.const] : (value.anyOf ?? []).map((entry) => entry.const).sort()
}

function dictionaryValues(values: Record<string, string>): string[] {
  return Object.values(values).sort()
}

function databaseValues(values: readonly string[]): string[] {
  return [...values].sort()
}

const modelPairs: [string, Record<string, string>, unknown][] = [
  ['AccountPlatform', AccountPlatform, AccountPlatformModel],
  ['LimitType', LimitType, LimitTypeModel],
  ['RecordGenre', RecordGenre, RecordGenreModel],
  ['RecordStatus', RecordStatus, RecordStatusModel],
  ['RecordGrade', RecordGrade, RecordGradeModel],
  ['RecordType', RecordType, RecordTypeModel],
  ['UserRole', UserRole, authModels.UserRole],
  ['WordleGameStatus', WordleGameStatus, wordleModels.WordleGameStatus],
  ['WordleLetterState', WordleLetterState, wordleModels.WordleLetterState],
  ['WordleHistoryStatus', WordleHistoryStatus, wordleModels.WordleHistoryStatus],
  ['IngredientCategory', IngredientCategory, cocktailModels.IngredientCategory],
  ['CocktailTier', CocktailTier, cocktailModels.CocktailTier],
  ['CocktailMethod', CocktailMethod, cocktailModels.CocktailMethod],
]

const databasePairs: [string, Record<string, string>, readonly string[]][] = [
  ['AccountPlatform', AccountPlatform, platformEnum.enumValues],
  ['LimitType', LimitType, limitTypeEnum.enumValues],
  ['RecordGenre', RecordGenre, recordGenreEnum.enumValues],
  ['RecordStatus', RecordStatus, recordStatusEnum.enumValues],
  ['RecordGrade', RecordGrade, recordGradeEnum.enumValues],
  ['RecordType', RecordType, recordTypeEnum.enumValues],
  ['UserRole', UserRole, userRoleEnum.enumValues],
  ['WordleGameStatus', WordleGameStatus, wordleGameStatusEnum.enumValues],
  ['IngredientCategory', IngredientCategory, ingredientCategoryEnum.enumValues],
  ['CocktailTier', CocktailTier, cocktailTierEnum.enumValues],
  ['CocktailMethod', CocktailMethod, cocktailMethodEnum.enumValues],
]

describe('enum sources', () => {
  for (const [name, dictionary, schema] of modelPairs) {
    test(`${name}: TypeBox-модель повторяет contract`, () => {
      expect(schemaValues(schema)).toEqual(dictionaryValues(dictionary))
    })
  }

  for (const [name, dictionary, values] of databasePairs) {
    test(`${name}: pgEnum повторяет contract`, () => {
      expect(databaseValues(values)).toEqual(dictionaryValues(dictionary))
    })
  }

  /**
   * Порядок в `pgEnum` — исторический (миграции не переупорядочивают значения),
   * поэтому сравниваем множества. Порядок отображения задаёт `contract`.
   */
  test('RecordStatus: порядок БД отличается от contract осознанно', () => {
    expect(Object.values(RecordStatus)).toEqual([
      'QUEUE',
      'PROGRESS',
      'DROP',
      'NOTINTERESTED',
      'UNFINISHED',
      'DONE',
    ])
    expect(recordStatusEnum.enumValues).toEqual([
      'QUEUE',
      'PROGRESS',
      'DROP',
      'UNFINISHED',
      'DONE',
      'NOTINTERESTED',
    ])
  })
})
