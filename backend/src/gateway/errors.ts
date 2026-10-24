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

/**
 * Мост для доменных ошибок. Доменные сервисы пока бросают Nest-исключения
 * (`NotFoundException`, `ConflictException`, …) — их нужно отдать тем же
 * статусом, что отдавал Nest.
 *
 * Проверка по `getStatus`, а не `instanceof HttpException`: гейтвей не должен
 * импортировать Nest. Когда домен перестанет знать про HTTP (#242, этап 2),
 * этот мост удаляется.
 */
export function fromDomainError(error: unknown): ApiError | null {
  if (error instanceof ApiError) return error

  // Nest отдавал статус через getStatus(), наши доменные ошибки — через
  // поле statusCode. Понимаем оба вида.
  const candidate = error as { getStatus?: unknown; statusCode?: unknown }
  const status =
    typeof candidate.getStatus === 'function'
      ? (candidate.getStatus as () => unknown).call(error)
      : candidate.statusCode

  if (typeof status !== 'number' || status < 400 || status > 599) return null

  const message = error instanceof Error ? error.message : (STATUS_TEXT[status] ?? 'Error')

  return new ApiError(status, message)
}
