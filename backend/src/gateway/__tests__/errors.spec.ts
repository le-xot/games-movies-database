import { describe, expect, it } from 'bun:test'
import { errorBody } from '@backend/gateway/errors'
import { HttpError, TooManyRequestsError } from '@backend/utils/errors'

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

describe('errorBody', () => {
  it('builds the ApiErrorDto envelope', () => {
    expect(errorBody(404, 'Not Found')).toEqual({
      statusCode: 404,
      message: 'Not Found',
      error: 'Not Found',
    })
  })
})
