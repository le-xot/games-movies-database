import { t } from 'elysia'

/**
 * Стандартный конверт ошибки. Форма повторяет то, что отдавал Nest
 * (`ApiErrorDto`), потому что фронт на неё завязан через `parseApiError`.
 */
export const ApiErrorModel = t.Object({
  statusCode: t.Number(),
  message: t.Union([t.String(), t.Array(t.String())]),
  error: t.Optional(t.String()),
})

/** Модели ошибок, которые регистрирует каждый роут-плагин гейтвея. */
export const apiErrorModels = { ApiErrorDto: ApiErrorModel }

export interface StandardErrorsOptions {
  /** Добавлять 401/403. Публичным эндпоинтам они не нужны. */
  auth?: boolean
}

export type StandardErrorResponses = {
  400: 'ApiErrorDto'
  404: 'ApiErrorDto'
  409: 'ApiErrorDto'
  429: 'ApiErrorDto'
  500: 'ApiErrorDto'
  401?: 'ApiErrorDto'
  403?: 'ApiErrorDto'
}

/**
 * Набор ответов с ошибками, который раньше добавлялся декоратором `@ApiErrors`
 * на контроллер. Живёт в одном месте, чтобы не расписывать шесть кодов на
 * каждый роут.
 */
export function standardErrors({
  auth = true,
}: StandardErrorsOptions = {}): StandardErrorResponses {
  const base: StandardErrorResponses = {
    400: 'ApiErrorDto',
    404: 'ApiErrorDto',
    409: 'ApiErrorDto',
    429: 'ApiErrorDto',
    500: 'ApiErrorDto',
  }

  return auth ? { ...base, 401: 'ApiErrorDto', 403: 'ApiErrorDto' } : base
}
