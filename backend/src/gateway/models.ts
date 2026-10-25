import { t } from 'elysia'

/**
 * Справочники записей. Регистрируются каждым роут-плагином гейтвея: строковая
 * ссылка на модель (`200: 'QueueDto'`) проверяется по реестру того `Elysia`, на
 * котором висит роут.
 */
export const AccountPlatform = t.Union([
  t.Literal('TWITCH'),
  t.Literal('KICK'),
  t.Literal('TELEGRAM'),
])
export const LimitType = t.Union([t.Literal('SUGGESTION')])

export const accountEnumModels = { AccountPlatform, LimitType }

export const RecordGenre = t.Union([
  t.Literal('GAME'),
  t.Literal('MOVIE'),
  t.Literal('ANIME'),
  t.Literal('CARTOON'),
  t.Literal('SERIES'),
])
export const RecordStatus = t.Union([
  t.Literal('QUEUE'),
  t.Literal('PROGRESS'),
  t.Literal('DROP'),
  t.Literal('NOTINTERESTED'),
  t.Literal('UNFINISHED'),
  t.Literal('DONE'),
])
export const RecordGrade = t.Union([
  t.Literal('DISLIKE'),
  t.Literal('BEER'),
  t.Literal('LIKE'),
  t.Literal('RECOMMEND'),
])
export const RecordType = t.Union([
  t.Literal('WRITTEN'),
  t.Literal('SUGGESTION'),
  t.Literal('ORDER'),
])

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
