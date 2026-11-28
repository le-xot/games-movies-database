import { describe, expect, it } from 'bun:test'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
} from '@backend/utils/errors'

/** Порт погоды — самый дешёвый способ бросить ошибку из реального роута. */
function gatewayThrowing(error: unknown) {
  return createTestGateway({
    weather: {
      getWeatherData: async () => {
        throw error
      },
    },
  })
}

async function requestWeather(error: unknown): Promise<{ status: number; body: unknown }> {
  const response = await gatewayThrowing(error).handle(new Request('http://localhost/weather'))

  return { status: response.status, body: await response.json() }
}

/**
 * Ловушка на конверт: каждый подкласс `HttpError` превращается в `ApiErrorDto`
 * со своим статусом, generic `Error` — в 500 без утечки текста.
 */
const MAPPED_ERRORS = [
  [new BadRequestError('bad input'), 400, 'Bad Request'],
  [new UnauthorizedError('who are you'), 401, 'Unauthorized'],
  [new ForbiddenError('not allowed'), 403, 'Forbidden'],
  [new NotFoundError('missing'), 404, 'Not Found'],
  [new ConflictError('already linked'), 409, 'Conflict'],
  [new TooManyRequestsError('slow down'), 429, 'Too Many Requests'],
  [new BadGatewayError('upstream failed'), 502, 'Error'],
  [new ServiceUnavailableError('maintenance'), 503, 'Service Unavailable'],
] as const

describe('gateway onError envelope', () => {
  for (const [error, status, errorText] of MAPPED_ERRORS) {
    it(`maps ${error.constructor.name} to ${status}`, async () => {
      const { status: actualStatus, body } = await requestWeather(error)

      expect(actualStatus).toBe(status)
      expect(body).toEqual({ statusCode: status, message: error.message, error: errorText })
    })
  }

  it('keeps retry-after header on 429', async () => {
    const response = await gatewayThrowing(
      new TooManyRequestsError('slow down', { 'retry-after': '5' }),
    ).handle(new Request('http://localhost/weather'))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('5')
  })

  it('turns an unknown error into 500 without leaking details', async () => {
    const { status, body } = await requestWeather(new Error('secret database detail'))

    expect(status).toBe(500)
    expect(body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    })
    expect(JSON.stringify(body)).not.toContain('secret')
  })
})
