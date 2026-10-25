import { describe, expect, it } from 'bun:test'
import { TelegramCommandRegistry } from '@backend/modules/telegram/telegram-command.registry'
import { TelegramUpdateHandler } from '@backend/modules/telegram/telegram-update.handler'
import type {
  TelegramCommandContext,
  TelegramMessage,
  TelegramUpdate,
} from '@backend/modules/telegram/telegram-bot.types'

const NOOP = () => {}

function createHandler() {
  const sent: [string, string][] = []
  const bot = {
    sendMessage: async (chatId: string, text: string) => {
      sent.push([chatId, text])
      return true
    },
  }
  const registry = new TelegramCommandRegistry(bot as never)
  return { handler: new TelegramUpdateHandler(bot as never, registry), sent, registry }
}

function privateUpdate(overrides?: Partial<TelegramMessage>): TelegramUpdate {
  return {
    message: {
      text: '/start token-1',
      chat: { id: 42, type: 'private' },
      from: { id: 7, username: 'ivan' },
      ...overrides,
    },
  }
}

describe('TelegramUpdateHandler', () => {
  it('answers /start with the command list', async () => {
    const { handler, sent, registry } = createHandler()
    registry.register({ name: 'wordle', description: 'Включить напоминания', handler: NOOP })

    await handler.handle(privateUpdate({ text: '/start' }))

    const [chatId, text] = sent[0] as [string, string]
    expect(chatId).toBe('42')
    expect(text).toContain('/wordle — Включить напоминания')
  })

  it('routes a registered command with the parsed context', async () => {
    const { handler, registry } = createHandler()
    const received: TelegramCommandContext[] = []
    registry.register({
      name: 'wordle',
      description: 'Включить напоминания',
      handler: (context) => {
        received.push(context)
      },
    })

    await handler.handle(privateUpdate({ text: '/wordle' }))

    expect(received).toEqual([
      { command: 'wordle', payload: null, chatId: '42', fromId: '7', username: 'ivan' },
    ])
  })

  it('strips the bot username suffix and empty payload', async () => {
    const { handler, registry } = createHandler()
    const received: TelegramCommandContext[] = []
    registry.register({
      name: 'wordle_off',
      description: 'Выключить напоминания',
      handler: (context) => {
        received.push(context)
      },
    })

    await handler.handle(privateUpdate({ text: '/wordle_off@wordle_bot' }))

    expect(received).toEqual([
      { command: 'wordle_off', payload: null, chatId: '42', fromId: '7', username: 'ivan' },
    ])
  })

  it('routes a start payload to the registered handler', async () => {
    const { handler, sent, registry } = createHandler()
    const received: TelegramCommandContext[] = []
    registry.registerStartPayload((context) => {
      received.push(context)
    })

    await handler.handle(privateUpdate({ text: '/start token-1' }))

    expect(received).toEqual([
      { command: 'start', payload: 'token-1', chatId: '42', fromId: '7', username: 'ivan' },
    ])
    expect(sent).toEqual([])
  })

  it('falls back to the greeting when no start payload handler is registered', async () => {
    const { handler, sent } = createHandler()

    await handler.handle(privateUpdate({ text: '/start token-1' }))

    const [, text] = sent[0] as [string, string]
    expect(text).toContain('/start — Показать приветствие и список команд')
  })

  it('answers unknown commands with the command list', async () => {
    const { handler, sent, registry } = createHandler()
    registry.register({ name: 'wordle', description: 'Включить напоминания', handler: NOOP })

    await handler.handle(privateUpdate({ text: '/settings' }))

    const [chatId, text] = sent[0] as [string, string]
    expect(chatId).toBe('42')
    expect(text).toContain('/wordle — Включить напоминания')
  })

  it('ignores group chats and plain text', async () => {
    const { handler, sent, registry } = createHandler()
    let commands = 0
    registry.register({
      name: 'wordle',
      description: 'Включить напоминания',
      handler: () => {
        commands += 1
      },
    })

    await handler.handle(privateUpdate({ chat: { id: 42, type: 'group' } }))
    await handler.handle(privateUpdate({ text: 'привет' }))

    expect(commands).toBe(0)
    expect(sent).toEqual([])
  })

  it('swallows handler errors', async () => {
    const { handler, registry } = createHandler()
    registry.register({
      name: 'wordle',
      description: 'Включить напоминания',
      handler: () => {
        throw new Error('boom')
      },
    })

    await expect(handler.handle(privateUpdate({ text: '/wordle' }))).resolves.toBeUndefined()
  })

  it('ignores updates without a message', async () => {
    const { handler } = createHandler()

    await expect(handler.handle({})).resolves.toBeUndefined()
  })
})
