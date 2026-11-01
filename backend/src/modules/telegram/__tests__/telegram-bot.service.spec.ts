import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  TelegramBotService,
  isValidWebhookSecret,
  webhookSecretsMatch,
  type TelegramBotConfig,
} from '@backend/modules/telegram/telegram-bot.service'

const CONFIG: TelegramBotConfig = {
  token: '123:abc',
  webhookUrl: 'https://le-xot.dev/api/telegram/webhook',
  webhookSecret: 'secret_123',
  retryDelayMs: 1,
  apiTimeoutMs: 200,
  initTimeoutMs: 100,
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('TelegramBotService', () => {
  let fetchMock: ReturnType<typeof mock<(input: string, init?: RequestInit) => Promise<Response>>>
  let service: TelegramBotService

  beforeEach(() => {
    fetchMock = mock(() => Promise.resolve(jsonResponse({ ok: true, result: { message_id: 1 } })))
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })
  })

  afterEach(() => {
    mock.restore()
  })

  function calls(): Array<{ url: string; body: Record<string, unknown> }> {
    return fetchMock.mock.calls.map(([url, init]) => ({
      url: String(url),
      body: JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>,
    }))
  }

  it('sends a message with an inline URL button', async () => {
    const ok = await service.sendMessage('42', 'Привет', {
      text: 'Играть',
      url: 'https://le-xot.dev/db/wordle',
    })

    expect(ok).toBe(true)
    expect(calls()).toEqual([
      {
        url: 'https://api.telegram.org/bot123:abc/sendMessage',
        body: {
          chat_id: '42',
          text: 'Привет',
          link_preview_options: { is_disabled: true },
          reply_markup: {
            inline_keyboard: [[{ text: 'Играть', url: 'https://le-xot.dev/db/wordle' }]],
          },
        },
      },
    ])
  })

  it('retries once and gives up after two failures', async () => {
    fetchMock = mock(() => Promise.resolve(jsonResponse({ ok: false, description: 'boom' }, 500)))
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })

    const ok = await service.sendMessage('42', 'Привет')

    expect(ok).toBe(false)
    expect(fetchMock.mock.calls.length).toBe(2)
  })

  it('caches the bot username only after a success', async () => {
    fetchMock = mock(() =>
      Promise.resolve(jsonResponse({ ok: true, result: { username: 'wordle_bot' } })),
    )
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })

    expect(await service.getBotUsername()).toBe('wordle_bot')
    expect(await service.getBotUsername()).toBe('wordle_bot')
    expect(fetchMock.mock.calls.length).toBe(1)
  })

  it('does not cache a failed getMe', async () => {
    fetchMock = mock(() => Promise.resolve(jsonResponse({ ok: false, description: 'nope' }, 401)))
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })

    expect(await service.getBotUsername()).toBeNull()
    expect(await service.getBotUsername()).toBeNull()
    expect(fetchMock.mock.calls.length).toBe(2)
  })

  it('registers the webhook with a secret and the handled update types', async () => {
    fetchMock = mock(() => Promise.resolve(jsonResponse({ ok: true, result: true })))
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })

    await service.ensureWebhook()

    expect(calls()).toEqual([
      {
        url: 'https://api.telegram.org/bot123:abc/setWebhook',
        body: {
          url: CONFIG.webhookUrl,
          secret_token: CONFIG.webhookSecret,
          allowed_updates: ['message', 'callback_query'],
        },
      },
    ])
  })

  it('initializes the bot and registers the webhook on startup', async () => {
    fetchMock = mock(() => Promise.resolve(jsonResponse({ ok: true, result: { id: 1 } })))
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })

    await service.onModuleInit()

    expect(calls().map(({ url }) => url)).toEqual([
      'https://api.telegram.org/bot123:abc/getMe',
      'https://api.telegram.org/bot123:abc/setWebhook',
    ])
  })

  it('survives a failed init and registers no webhook', async () => {
    fetchMock = mock(() => Promise.reject(new Error('телеграм недоступен')))
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })

    await expect(service.onModuleInit()).resolves.toBeUndefined()

    const urls = calls().map(({ url }) => url)
    expect(urls.length).toBeGreaterThan(0)
    expect(urls).not.toContain('https://api.telegram.org/bot123:abc/setWebhook')
  })

  it('keeps the update handler alive after a failed init', async () => {
    let failInit = true
    fetchMock = mock((url: string) => {
      if (failInit && String(url).endsWith('/getMe')) {
        return Promise.reject(new Error('телеграм недоступен'))
      }
      return Promise.resolve(jsonResponse({ ok: true, result: { id: 1, username: 'wordle_bot' } }))
    })
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })
    service.sendMessage = mock(() => Promise.resolve(true)) as never

    await service.onModuleInit()
    failInit = false

    await expect(
      service.handleUpdate({
        update_id: 5,
        message: {
          message_id: 1,
          date: 1_760_000_000,
          text: '/start',
          chat: { id: 42, type: 'private' },
          from: { id: 7, is_bot: false, first_name: 'Иван' },
        },
      }),
    ).resolves.toBeUndefined()

    // Второй getMe прошёл в handleUpdate, значит бот ожил без рестарта.
    expect(calls().map(({ url }) => url)).toContain('https://api.telegram.org/bot123:abc/getMe')
    expect(service.sendMessage).toHaveBeenCalled()
  })

  it('does not hand out the webhook secret when the bot is not fully configured', () => {
    service = new TelegramBotService({
      token: '123:abc',
      webhookUrl: null,
      webhookSecret: 'secret_123',
      fetch: fetchMock as unknown as typeof fetch,
    })

    expect(service.getWebhookSecret()).toBeNull()
  })

  it('survives an empty token from .env.example', async () => {
    service = new TelegramBotService({
      token: '',
      webhookUrl: '',
      webhookSecret: '',
      fetch: fetchMock as unknown as typeof fetch,
    })

    expect(service.isConfigured()).toBe(false)
    expect(service.getWebhookSecret()).toBeNull()
    await expect(service.handleUpdate({ update_id: 1 })).resolves.toBeUndefined()
    expect(fetchMock.mock.calls.length).toBe(0)
  })

  it('skips a command Telegram would reject', () => {
    service.registerCommand('Wordle', 'Верхний регистр', () => {})
    service.registerCommand('wordle', '', () => {})

    expect(service.menu()).toEqual([
      { command: 'start', description: 'Показать приветствие и список команд' },
      { command: 'help', description: 'Показать список команд' },
    ])
  })

  it('publishes the command menu', async () => {
    fetchMock = mock(() => Promise.resolve(jsonResponse({ ok: true, result: true })))
    service = new TelegramBotService({ ...CONFIG, fetch: fetchMock as unknown as typeof fetch })
    service.registerCommand('wordle', 'Включить напоминания', () => {})

    await service.onApplicationBootstrap()

    expect(calls()).toEqual([
      {
        url: 'https://api.telegram.org/bot123:abc/setMyCommands',
        body: {
          commands: [
            { command: 'start', description: 'Показать приветствие и список команд' },
            { command: 'help', description: 'Показать список команд' },
            { command: 'wordle', description: 'Включить напоминания' },
          ],
        },
      },
    ])
  })

  it('skips publishing commands without a full config', async () => {
    service = new TelegramBotService({
      token: '123:abc',
      webhookUrl: null,
      webhookSecret: null,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await service.onApplicationBootstrap()

    expect(fetchMock.mock.calls.length).toBe(0)
  })

  it('skips webhook registration without a full config', async () => {
    service = new TelegramBotService({
      token: '123:abc',
      webhookUrl: null,
      webhookSecret: null,
      fetch: fetchMock as unknown as typeof fetch,
    })

    await service.ensureWebhook()

    expect(fetchMock.mock.calls.length).toBe(0)
    expect(service.isConfigured()).toBe(false)
  })
})

describe('webhook secret helpers', () => {
  it('validates the Bot API format', () => {
    expect(isValidWebhookSecret('abc_DEF-123')).toBe(true)
    expect(isValidWebhookSecret('')).toBe(false)
    expect(isValidWebhookSecret('bad secret')).toBe(false)
    expect(isValidWebhookSecret(null)).toBe(false)
    expect(isValidWebhookSecret(undefined)).toBe(false)
  })

  it('rejects missing, short and different secrets', () => {
    expect(webhookSecretsMatch(undefined, 'secret_123')).toBe(false)
    expect(webhookSecretsMatch('short', 'secret_123')).toBe(false)
    expect(webhookSecretsMatch('secret_124', 'secret_123')).toBe(false)
    expect(webhookSecretsMatch('secret_123', 'secret_123')).toBe(true)
  })
})
