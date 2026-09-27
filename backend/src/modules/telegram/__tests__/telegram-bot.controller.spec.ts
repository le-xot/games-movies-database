import { describe, expect, it, mock } from 'bun:test'
import { UnauthorizedException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { TelegramBotController } from '@/modules/telegram/telegram-bot.controller'
import { TelegramBotEvents } from '@/modules/telegram/telegram-bot.events'
import type { TelegramMessage, TelegramUpdate } from '@/modules/telegram/telegram-bot.types'

const SECRET = 'secret_123'

function createController() {
  const bot = {
    getWebhookSecret: mock(() => SECRET),
    sendMessage: mock(() => Promise.resolve(true)),
  }
  const events = new EventEmitter2()
  const controller = new TelegramBotController(bot as never, events)
  return { controller, bot, events }
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

  it('emits a command event with the payload', async () => {
    const { controller, events } = createController()
    const received: unknown[] = []
    events.on(TelegramBotEvents.COMMAND, (payload: unknown) => received.push(payload))

    const result = await controller.handleUpdate(SECRET, privateUpdate())

    expect(result).toEqual({ ok: true })
    expect(received).toEqual([
      { command: 'start', payload: 'token-1', chatId: '42', fromId: '7', username: 'ivan' },
    ])
  })

  it('strips the bot username suffix and empty payload', async () => {
    const { controller, events } = createController()
    const received: Array<Record<string, unknown>> = []
    events.on(TelegramBotEvents.COMMAND, (payload: Record<string, unknown>) =>
      received.push(payload),
    )

    await controller.handleUpdate(SECRET, privateUpdate({ text: '/stop@wordle_bot' }))

    expect(received).toEqual([
      { command: 'stop', payload: null, chatId: '42', fromId: '7', username: 'ivan' },
    ])
  })

  it('ignores group chats and plain text', async () => {
    const { controller, events } = createController()
    let commands = 0
    events.on(TelegramBotEvents.COMMAND, () => {
      commands += 1
    })

    await controller.handleUpdate(SECRET, privateUpdate({ chat: { id: 42, type: 'group' } }))
    await controller.handleUpdate(SECRET, privateUpdate({ text: 'привет' }))

    expect(commands).toBe(0)
  })

  it('answers unknown commands with help', async () => {
    const { controller, bot } = createController()

    await controller.handleUpdate(SECRET, privateUpdate({ text: '/settings' }))

    expect(bot.sendMessage).toHaveBeenCalledWith('42', 'Доступные команды: /start, /stop')
  })

  it('returns ok for updates without a message', async () => {
    const { controller } = createController()
    expect(await controller.handleUpdate(SECRET, {})).toEqual({ ok: true })
  })
})
