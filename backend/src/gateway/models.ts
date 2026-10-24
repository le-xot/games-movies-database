import { t } from 'elysia'

/**
 * Справочники записей. Регистрируются каждым роут-плагином гейтвея: строковая
 * ссылка на модель (`200: 'QueueDto'`) проверяется по реестру того `Elysia`, на
 * котором висит роут.
 */
export const accountEnumModels = {
  AccountPlatform: t.Union([t.Literal('TWITCH'), t.Literal('KICK'), t.Literal('TELEGRAM')]),
  LimitType: t.Union([t.Literal('SUGGESTION')]),
}

export const recordEnumModels = {
  RecordGenre: t.Union([
    t.Literal('GAME'),
    t.Literal('MOVIE'),
    t.Literal('ANIME'),
    t.Literal('CARTOON'),
    t.Literal('SERIES'),
  ]),
  RecordStatus: t.Union([
    t.Literal('QUEUE'),
    t.Literal('PROGRESS'),
    t.Literal('DROP'),
    t.Literal('NOTINTERESTED'),
    t.Literal('UNFINISHED'),
    t.Literal('DONE'),
  ]),
  RecordGrade: t.Union([
    t.Literal('DISLIKE'),
    t.Literal('BEER'),
    t.Literal('LIKE'),
    t.Literal('RECOMMEND'),
  ]),
  RecordType: t.Union([t.Literal('WRITTEN'), t.Literal('SUGGESTION'), t.Literal('ORDER')]),
}
