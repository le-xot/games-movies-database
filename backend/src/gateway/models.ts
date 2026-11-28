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
 * Схемы перечислений строятся из словарей `@gmdb/contract` штатным `t.Enum`:
 * TypeBox сам собирает union литералов и сохраняет литеральный тип, поэтому
 * типы Eden не деградируют до `string`.
 *
 * Справочники записей регистрируются каждым роут-плагином гейтвея: строковая
 * ссылка на модель (`200: 'QueueDto'`) проверяется по реестру того `Elysia`, на
 * котором висит роут.
 */
export const AccountPlatform = t.Enum(AccountPlatformValues)
export const LimitType = t.Enum(LimitTypeValues)

export const accountEnumModels = { AccountPlatform, LimitType }

export const RecordGenre = t.Enum(RecordGenreValues)
export const RecordStatus = t.Enum(RecordStatusValues)
export const RecordGrade = t.Enum(RecordGradeValues)
export const RecordType = t.Enum(RecordTypeValues)

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
