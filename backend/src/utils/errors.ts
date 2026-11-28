/**
 * Единственная ошибка с HTTP-семантикой. Домен и гейтвей бросают подклассы,
 * а гейтвей превращает их в конверт `ApiErrorDto` в одном месте — `onError`
 * из `gateway/index.ts`.
 *
 * Форма конверта (`statusCode`/`message`/`error`) зафиксирована фронтовым
 * `parseApiError`, поэтому коды и тексты — часть внешнего контракта.
 */
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly headers?: Record<string, string>,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', headers?: Record<string, string>) {
    super(400, message, headers)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', headers?: Record<string, string>) {
    super(401, message, headers)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', headers?: Record<string, string>) {
    super(403, message, headers)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', headers?: Record<string, string>) {
    super(404, message, headers)
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', headers?: Record<string, string>) {
    super(409, message, headers)
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'Too Many Requests', headers?: Record<string, string>) {
    super(429, message, headers)
  }
}

export class BadGatewayError extends HttpError {
  constructor(message = 'Bad Gateway', headers?: Record<string, string>) {
    super(502, message, headers)
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = 'Service Unavailable', headers?: Record<string, string>) {
    super(503, message, headers)
  }
}
