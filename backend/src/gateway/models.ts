import {
  AccountPlatform as AccountPlatformValues,
  LimitType as LimitTypeValues,
  RecordGenre as RecordGenreValues,
  RecordGrade as RecordGradeValues,
  RecordStatus as RecordStatusValues,
  RecordType as RecordTypeValues,
} from '@gmdb/contract'
import { t } from 'elysia'

/**
 * TypeBox-union из константного словаря `@gmdb/contract`. Значения объявлены
 * один раз — в контракте; литеральный тип union'а сохраняется, поэтому типы
 * Eden не деградируют до `string`.
 */
type LiteralSchema<Value extends string> = ReturnType<typeof t.Literal<Value>>

export function enumUnion<const Values extends Record<string, string>>(values: Values) {
  // `Object.values` теряет точный тип значений у объектного литерала — без
  // приведения TypeBox вывел бы `string` вместо объединения литералов.
  type Value = Values[keyof Values]
  const literals = Object.values(values).map((value) => t.Literal(value as Value)) as [
    LiteralSchema<Value>,
    ...LiteralSchema<Value>[],
  ]

  return t.Union(literals)
}

/**
 * Справочники записей. Регистрируются каждым роут-плагином гейтвея: строковая
 * ссылка на модель (`200: 'QueueDto'`) проверяется по реестру того `Elysia`, на
 * котором висит роут.
 */
export const AccountPlatform = enumUnion(AccountPlatformValues)
export const LimitType = enumUnion(LimitTypeValues)

export const accountEnumModels = { AccountPlatform, LimitType }

export const RecordGenre = enumUnion(RecordGenreValues)
export const RecordStatus = enumUnion(RecordStatusValues)
export const RecordGrade = enumUnion(RecordGradeValues)
export const RecordType = enumUnion(RecordTypeValues)

export const recordEnumModels = { RecordGenre, RecordStatus, RecordGrade, RecordType }

/**
 * Ссылка на внешний ресурс. Ближе всего к `@IsUrl()` из class-validator:
 * абсолютный http(s) с хостом, в котором есть точка. IP-литералы и `localhost`
 * тут проходят, но их всё равно отбивает allow-list провайдеров.
 */
export const HTTP_URL_PATTERN = '^https?://[^/\\s]+\\.[^/\\s]+'

/** Ответ на действие без полезной нагрузки: `{ success: true }`. */
export const SuccessResponseDTO = t.Object({ success: t.Boolean() })

export const commonModels = { SuccessResponseDTO }
