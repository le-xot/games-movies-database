/**
 * HTTP-ошибки домена. Имена совпадают с Nest-исключениями, чтобы код сервисов
 * не пришлось переписывать: заменился только источник импорта.
 *
 * Гейтвей превращает их в ответ через `fromDomainError` (смотрит на
 * `statusCode`). Когда домен окончательно отвыкнет от HTTP, эти классы заменятся
 * на предметные ошибки, а маппинг переедет в гейтвей.
 */
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export const HttpStatus = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const

export class BadRequestException extends HttpError {
  constructor(message = 'Bad Request') {
    super(HttpStatus.BAD_REQUEST, message)
  }
}

export class UnauthorizedException extends HttpError {
  constructor(message = 'Unauthorized') {
    super(HttpStatus.UNAUTHORIZED, message)
  }
}

export class ForbiddenException extends HttpError {
  constructor(message = 'Forbidden') {
    super(HttpStatus.FORBIDDEN, message)
  }
}

export class NotFoundException extends HttpError {
  constructor(message = 'Not Found') {
    super(HttpStatus.NOT_FOUND, message)
  }
}

export class ConflictException extends HttpError {
  constructor(message = 'Conflict') {
    super(HttpStatus.CONFLICT, message)
  }
}

export class ServiceUnavailableException extends HttpError {
  constructor(message = 'Service Unavailable') {
    super(HttpStatus.SERVICE_UNAVAILABLE, message)
  }
}

/** Совместимость с `new HttpException(message, status)`. */
export class HttpException extends HttpError {
  constructor(message: string, statusCode: number) {
    super(statusCode, message)
  }
}
