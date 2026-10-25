import { describe, expect, it, mock } from 'bun:test'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'

const SECRET = 'secret_123'

function request(body: unknown, secret?: string) {
  return new Request('http://localhost/telegram/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret === undefined ? {} : { 'x-telegram-bot-api-secret-token': secret }),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /telegram/webhook', () => {
  it('rejects a request without the secret header', async () => {
    const handleUpdate = mock(async () => {})
    const gateway = createTestGateway({
      telegramWebhook: { getWebhookSecret: () => SECRET, handleUpdate },
    })

    const response = await gateway.handle(request({ message: { text: '/start' } }))

    expect(response.status).toBe(401)
    expect(handleUpdate).not.toHaveBeenCalled()
  })

  it('rejects a request with a wrong secret', async () => {
    const handleUpdate = mock(async () => {})
    const gateway = createTestGateway({
      telegramWebhook: { getWebhookSecret: () => SECRET, handleUpdate },
    })

    const response = await gateway.handle(request({ message: { text: '/start' } }, 'wrong_secret'))

    expect(response.status).toBe(401)
    expect(handleUpdate).not.toHaveBeenCalled()
  })

  it('rejects every request when the webhook secret is not configured', async () => {
    const handleUpdate = mock(async () => {})
    const gateway = createTestGateway({
      telegramWebhook: { getWebhookSecret: () => null, handleUpdate },
    })

    const response = await gateway.handle(request({ message: { text: '/start' } }, ''))

    expect(response.status).toBe(401)
    expect(handleUpdate).not.toHaveBeenCalled()
  })

  it('delegates a valid update and answers ok', async () => {
    const handleUpdate = mock(async (_update: unknown) => {})
    const gateway = createTestGateway({
      telegramWebhook: { getWebhookSecret: () => SECRET, handleUpdate },
    })

    const response = await gateway.handle(request({ message: { text: '/start token-1' } }, SECRET))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(handleUpdate).toHaveBeenCalledTimes(1)
    expect(handleUpdate.mock.calls[0]?.[0]).toMatchObject({
      message: { text: '/start token-1' },
    })
  })
})
