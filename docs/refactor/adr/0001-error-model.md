# 0001 — Одна модель ошибок: `HttpError`-подклассы в `utils/errors.ts`

## Контекст

До батча 4 в бэкенде жили две иерархии ошибок: доменные Nest-именованные
`*Exception` из `utils/errors.ts` и гейтвейный `ApiError` из `gateway/errors.ts`.
Мост `fromDomainError` угадывал статус по полю `statusCode`, а третьим путём был
generic `Error` → 500 даже в клиентских ветках (уже привязанный аккаунт получал
500 вместо 409).

## Решение

- Единственная иерархия — `utils/errors.ts`: `HttpError(statusCode, message, headers?)`
  и подклассы `BadRequestError … ServiceUnavailableError`. Статус и сообщение живут
  рядом с ошибкой.
- Гейтвей владеет только конвертом (`ApiErrorModel`, `errorBody`, `standardErrors` /
  `publicErrors`) и ловит `HttpError` через `instanceof` в `onError`.
- Generic `Error` в клиентских ветках запрещён; инфраструктурный generic `Error`
  по-прежнему означает 500.

## Альтернативы

1. **Доменный `code` + таблица `code → status` в гейтвее.** Отклонено deletion test'ом:
   слой дублировал бы уже существующую семантику, а таблица стала бы вторым
   словарём статусов.
2. **Оставить мост с duck-typing `statusCode`.** Отклонено: скрывает контракт и
   превращает произвольный объект с числовым `statusCode` в HTTP-ответ.

## Последствия

- 104 throw-сайта переписаны 1:1 (A/B-сравнение в ревью батча 4); конверт на проводе
  (`statusCode`/`message`/`error`, `Retry-After` для 429) не изменился.
- Осознанный bugfix: `linkPlatformAccount` → 409 вместо 500. Фронт не ветвится по
  статусу, показывает `message`.
- Ловушки: `gateway/__tests__/on-error.spec.ts` (каждый класс через реальный роут),
  таблица дефолтов в `errors.spec.ts`, регресс 409 в `user.service.spec.ts`.
