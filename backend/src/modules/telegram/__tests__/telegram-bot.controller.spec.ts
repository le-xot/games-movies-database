import { describe, expect, it, mock } from 'bun:test'
import { UnauthorizedException } from '@nestjs/common'
import { TelegramBotController } from '@/modules/telegram/telegram-bot.controller'
import { TelegramCommandRegistry } from '@/modules/telegram/telegram-command.registry'
import type {
  TelegramCommandContext,
  TelegramMessage,
  TelegramUpdate,
} from '@/modules/telegram/telegram-bot.types'

const SECRET = 'secret_123'
const NOOP = () => {}

function createController() {
  const bot = {
    getWebhookSecret: mock(() => SECRET),
    sendMessage: mock(() => Promise.resolve(true)),
  }
  const registry = new TelegramCommandRegistry(bot as never)
  const controller = new TelegramBotController(bot as never, registry)
  return { controller, bot, registry }
}

function sentMessages(bot: { sendMessage: ReturnType<typeof mock> }): [string, string][] {
  return bot.sendMessage.mock.calls as [string, string][]
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

describe('TelegramBotController', () => {
  it('rejects requests without the secret header', async () => {
    const { controller } = createController()
    await expect(controller.handleUpdate(undefined, privateUpdate())).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('rejects requests with a wrong-length secret', async () => {
    const { controller } = createController()
    await expect(controller.handleUpdate('short', privateUpdate())).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('answers /start with the command list', async () => {
    const { controller, bot, registry } = createController()
    registry.register({ name: 'wordle', description: 'Включить напоминания', handler: NOOP })

    const result = await controller.handleUpdate(SECRET, privateUpdate({ text: '/start' }))

    expect(result).toEqual({ ok: true })
    const [chatId, text] = sentMessages(bot)[0] as [string, string]
    expect(chatId).toBe('42')
    expect(text).toContain('/wordle — Включить напоминания')
  })

  it('routes a registered command with the parsed context', async () => {
    const { controller, registry } = createController()
    const received: TelegramCommandContext[] = []
    registry.register({
      name: 'wordle',
      description: 'Включить напоминания',
      handler: (context) => {
        received.push(context)
      },
    })

    await controller.handleUpdate(SECRET, privateUpdate({ text: '/wordle' }))

    expect(received).toEqual([
      { command: 'wordle', payload: null, chatId: '42', fromId: '7', username: 'ivan' },
    ])
  })

  it('strips the bot username suffix and empty payload', async () => {
    const { controller, registry } = createController()
    const received: TelegramCommandContext[] = []
    registry.register({
      name: 'wordle_off',
      description: 'Выключить напоминания',
      handler: (context) => {
        received.push(context)
      },
    })

    await controller.handleUpdate(SECRET, privateUpdate({ text: '/wordle_off@wordle_bot' }))

    expect(received).toEqual([
      { command: 'wordle_off', payload: null, chatId: '42', fromId: '7', username: 'ivan' },
    ])
  })

  it('routes a start payload to the registered handler', async () => {
    const { controller, bot, registry } = createController()
    const received: TelegramCommandContext[] = []
    registry.registerStartPayload((context) => {
      received.push(context)
    })

    await controller.handleUpdate(SECRET, privateUpdate({ text: '/start token-1' }))

    expect(received).toEqual([
      { command: 'start', payload: 'token-1', chatId: '42', fromId: '7', username: 'ivan' },
    ])
    expect(bot.sendMessage).not.toHaveBeenCalled()
  })

  it('falls back to the greeting when no start payload handler is registered', async () => {
    const { controller, bot } = createController()

    await controller.handleUpdate(SECRET, privateUpdate({ text: '/start token-1' }))

    const [, text] = sentMessages(bot)[0] as [string, string]
    expect(text).toContain('/start — Показать приветствие и список команд')
  })

  it('answers unknown commands with the command list', async () => {
    const { controller, bot, registry } = createController()
    registry.register({ name: 'wordle', description: 'Включить напоминания', handler: NOOP })

    await controller.handleUpdate(SECRET, privateUpdate({ text: '/settings' }))

    const [chatId, text] = sentMessages(bot)[0] as [string, string]
    expect(chatId).toBe('42')
    expect(text).toContain('/wordle — Включить напоминания')
  })

  it('ignores group chats and plain text', async () => {
    const { controller, registry } = createController()
    let commands = 0
    registry.register({
      name: 'wordle',
      description: 'Включить напоминания',
      handler: () => {
        commands += 1
      },
    })

    await controller.handleUpdate(SECRET, privateUpdate({ chat: { id: 42, type: 'group' } }))
    await controller.handleUpdate(SECRET, privateUpdate({ text: 'привет' }))

    expect(commands).toBe(0)
  })

  it('swallows handler errors and still returns ok', async () => {
    const { controller, registry } = createController()
    registry.register({
      name: 'wordle',
      description: 'Включить напоминания',
      handler: () => {
        throw new Error('boom')
      },
    })

    expect(await controller.handleUpdate(SECRET, privateUpdate({ text: '/wordle' }))).toEqual({
      ok: true,
    })
  })

  it('returns ok for updates without a message', async () => {
    const { controller } = createController()
    expect(await controller.handleUpdate(SECRET, {})).toEqual({ ok: true })
  })
})
