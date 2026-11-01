import { describe, expect, it, mock } from 'bun:test'
import { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import type { TelegramCommandContext } from '@backend/modules/telegram/telegram-bot.types'
import type { UserFromGetMe } from 'grammy/types'

const BOT_INFO = {
  id: 1,
  is_bot: true,
  first_name: 'Wordle',
  username: 'wordle_bot',
} as unknown as UserFromGetMe

type SentCall = [string, string, { text: string; url: string }?]

function createService() {
  const service = new TelegramBotService({
    token: '123:abc',
    webhookUrl: 'https://le-xot.dev/api/telegram/webhook',
    webhookSecret: 'secret_123',
    botInfo: BOT_INFO,
    fetch: (() => Promise.reject(new Error('сеть в тестах запрещена'))) as unknown as typeof fetch,
  })

  const sent: SentCall[] = []
  service.sendMessage = mock(
    async (chatId: string, text: string, button?: { text: string; url: string }) => {
      sent.push(button ? [chatId, text, button] : [chatId, text])
      return true
    },
  ) as unknown as TelegramBotService['sendMessage']

  return { service, sent }
}

function messageUpdate(
  text: string,
  options: { chatType?: string; username?: string | null } = {},
) {
  return {
    update_id: 1,
    message: {
      message_id: 10,
      date: 1_760_000_000,
      text,
      chat: { id: 42, type: options.chatType ?? 'private' },
      from: {
        id: 7,
        is_bot: false,
        first_name: 'Иван',
        ...(options.username ? { username: options.username } : {}),
      },
    },
  }
}

describe('TelegramBotService.handleUpdate', () => {
  it('answers /start with the command list', async () => {
    const { service, sent } = createService()
    service.registerCommand('wordle', 'Включить напоминания', () => {})

    await service.handleUpdate(messageUpdate('/start'))

    const [chatId, text] = sent[0] as SentCall
    expect(chatId).toBe('42')
    expect(text).toContain('/wordle — Включить напоминания')
  })

  it('routes a registered command with the parsed context', async () => {
    const { service } = createService()
    const received: TelegramCommandContext[] = []
    service.registerCommand('wordle', 'Включить напоминания', (context) => {
      received.push(context)
    })

    await service.handleUpdate(messageUpdate('/wordle', { username: 'ivan' }))

    expect(received).toEqual([
      {
        command: 'wordle',
        payload: null,
        chatId: '42',
        fromId: '7',
        username: 'ivan',
      },
    ])
  })

  it('strips the bot username suffix and the empty payload', async () => {
    const { service } = createService()
    const received: TelegramCommandContext[] = []
    service.registerCommand('wordle_off', 'Выключить напоминания', (context) => {
      received.push(context)
    })

    await service.handleUpdate(messageUpdate('/wordle_off@wordle_bot'))

    expect(received).toEqual([
      {
        command: 'wordle_off',
        payload: null,
        chatId: '42',
        fromId: '7',
        username: null,
      },
    ])
  })

  it('routes a start payload to the registered handler', async () => {
    const { service, sent } = createService()
    const received: TelegramCommandContext[] = []
    service.registerStartHandler((context) => {
      received.push(context)
      return true
    })

    await service.handleUpdate(messageUpdate('/start wordle_token-1'))

    expect(received).toEqual([
      {
        command: 'start',
        payload: 'wordle_token-1',
        chatId: '42',
        fromId: '7',
        username: null,
      },
    ])
    expect(sent).toEqual([])
  })

  it('falls back to the greeting when no start handler claims the payload', async () => {
    const { service, sent } = createService()
    service.registerStartHandler(() => false)

    await service.handleUpdate(messageUpdate('/start token-1'))

    const [, text] = sent[0] as SentCall
    expect(text).toContain('/start — Показать приветствие и список команд')
  })

  it('answers unknown commands with the command list', async () => {
    const { service, sent } = createService()

    await service.handleUpdate(messageUpdate('/settings'))

    const [chatId, text] = sent[0] as SentCall
    expect(chatId).toBe('42')
    expect(text).toContain('/help — Показать список команд')
  })

  it('ignores group chats and plain text', async () => {
    const { service, sent } = createService()
    let handled = 0
    service.registerCommand('wordle', 'Включить напоминания', () => {
      handled += 1
    })

    await service.handleUpdate(messageUpdate('/wordle', { chatType: 'group' }))
    await service.handleUpdate(messageUpdate('привет'))

    expect(handled).toBe(0)
    expect(sent).toEqual([])
  })

  it('swallows handler errors', async () => {
    const { service } = createService()
    service.registerCommand('wordle', 'Включить напоминания', () => {
      throw new Error('boom')
    })

    await expect(service.handleUpdate(messageUpdate('/wordle'))).resolves.toBeUndefined()
  })

  it('ignores updates without a message', async () => {
    const { service, sent } = createService()

    await expect(service.handleUpdate({ update_id: 2 })).resolves.toBeUndefined()
    expect(sent).toEqual([])
  })

  it('accepts a callback query without crashing when no handler exists', async () => {
    const { service } = createService()

    await expect(
      service.handleUpdate({
        update_id: 3,
        callback_query: {
          id: 'cb-1',
          from: { id: 7, is_bot: false, first_name: 'Иван' },
          chat_instance: '1',
          data: 'wordle:1',
          message: {
            message_id: 10,
            date: 1_760_000_000,
            chat: { id: 42, type: 'private' },
          },
        },
      }),
    ).resolves.toBeUndefined()
  })
})
