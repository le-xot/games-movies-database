import { describe, expect, it } from 'bun:test'
import { ApiError, errorBody, fromDomainError } from '@backend/gateway/errors'
import { NotFoundException } from '@backend/utils/errors'

describe('fromDomainError', () => {
  it('keeps gateway errors as is', () => {
    const error = new ApiError(429, 'slow down', { 'retry-after': '5' })

    expect(fromDomainError(error)).toBe(error)
  })

  it('maps a Nest HttpException to the same status and message', () => {
    const mapped = fromDomainError(new NotFoundException('User not found'))

    expect(mapped).toBeInstanceOf(ApiError)
    expect(mapped?.statusCode).toBe(404)
    expect(mapped?.message).toBe('User not found')
  })

  it('ignores errors that are not HTTP-like', () => {
    expect(fromDomainError(new Error('boom'))).toBeNull()
  })
})

describe('errorBody', () => {
  it('builds the Nest envelope', () => {
    expect(errorBody(404, 'Not Found')).toEqual({
      statusCode: 404,
      message: 'Not Found',
      error: 'Not Found',
    })
  })
})
