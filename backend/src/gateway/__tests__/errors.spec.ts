import { describe, expect, it } from 'bun:test'
import { errorBody } from '@backend/gateway/errors'
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  HttpError,
  NotFoundError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
} from '@backend/utils/errors'

describe('HttpError', () => {
  it('carries status, message and headers', () => {
    const error = new TooManyRequestsError('slow down', { 'retry-after': '5' })

    expect(error).toBeInstanceOf(HttpError)
    expect(error.statusCode).toBe(429)
    expect(error.message).toBe('slow down')
    expect(error.headers).toEqual({ 'retry-after': '5' })
  })

  it('uses the subclass name', () => {
    expect(new TooManyRequestsError().name).toBe('TooManyRequestsError')
  })

  it('is not a domain-agnostic Error substitute', () => {
    expect(new Error('boom')).not.toBeInstanceOf(HttpError)
  })
})

describe('HttpError subclasses', () => {
  const defaults = [
    [new BadRequestError(), 400, 'Bad Request'],
    [new UnauthorizedError(), 401, 'Unauthorized'],
    [new ForbiddenError(), 403, 'Forbidden'],
    [new NotFoundError(), 404, 'Not Found'],
    [new ConflictError(), 409, 'Conflict'],
    [new TooManyRequestsError(), 429, 'Too Many Requests'],
    [new BadGatewayError(), 502, 'Bad Gateway'],
    [new ServiceUnavailableError(), 503, 'Service Unavailable'],
  ] as const

  for (const [error, status, message] of defaults) {
    it(`${error.constructor.name} carries ${status} and a default message`, () => {
      expect(error).toBeInstanceOf(HttpError)
      expect(error.statusCode).toBe(status)
      expect(error.message).toBe(message)
    })
  }
})

describe('errorBody', () => {
  it('builds the ApiErrorDto envelope', () => {
    expect(errorBody(404, 'Not Found')).toEqual({
      statusCode: 404,
      message: 'Not Found',
      error: 'Not Found',
    })
  })
})
