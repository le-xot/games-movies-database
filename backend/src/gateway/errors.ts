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

/**
 * Ошибка гейтвея: несёт HTTP-статус, сообщение и заголовки, а превращается в
 * ответ в одном месте — в обработчике `onError` из `gateway/index.ts`.
 */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly headers?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
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
