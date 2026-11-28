import { t } from 'elysia'

/**
 * Стандартный конверт ошибки. Форма повторяет то, что отдавал Nest
 * (`ApiErrorDto`), потому что фронт на неё завязан через `parseApiError`.
 * Сами ошибки — `HttpError`-подклассы из `utils/errors.ts`.
 */
export const ApiErrorModel = t.Object({
  statusCode: t.Number(),
  message: t.Union([t.String(), t.Array(t.String())]),
  error: t.Optional(t.String()),
})

/** Модели ошибок, которые регистрирует каждый роут-плагин гейтвея. */
export const apiErrorModels = { ApiErrorDto: ApiErrorModel }

const BASE_ERRORS = {
  400: 'ApiErrorDto',
  404: 'ApiErrorDto',
  409: 'ApiErrorDto',
  429: 'ApiErrorDto',
  500: 'ApiErrorDto',
} as const

export type BaseErrorResponses = typeof BASE_ERRORS
export type ProtectedErrorResponses = BaseErrorResponses & {
  401: 'ApiErrorDto'
  403: 'ApiErrorDto'
}

/**
 * Набор ответов с ошибками, который раньше добавлялся декоратором `@ApiErrors`.
 *
 * Две отдельные функции вместо флага: у публичных и защищённых роутов разный
 * набор кодов, и опциональные ключи (`401?`) ломают вывод типов у Elysia в
 * проектах без `exactOptionalPropertyTypes`.
 */
export function standardErrors(): ProtectedErrorResponses {
  return { ...BASE_ERRORS, 401: 'ApiErrorDto', 403: 'ApiErrorDto' }
}

export function publicErrors(): BaseErrorResponses {
  return BASE_ERRORS
}

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
}

export function errorBody(statusCode: number, message: string) {
  return {
    statusCode,
    message,
    error: STATUS_TEXT[statusCode] ?? 'Error',
  }
}
