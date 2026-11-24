import { describe, expect, it, mock } from 'bun:test'
import { WordleGameStatus } from '@backend/enums'
import { WordleMiniAppService } from '@backend/modules/wordle/wordle-miniapp.service'
import type { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import type {
  TelegramCommandContext,
  TelegramCommandHandler,
} from '@backend/modules/telegram/telegram-bot.types'
import type { UserService } from '@backend/modules/user/user.service'
import type { WordleService } from '@backend/modules/wordle/wordle.service'

const CONTEXT: TelegramCommandContext = {
  command: 'wordle',
  payload: null,
  chatId: '42',
  fromId: '7',
  username: 'ivan',
}

const GENERIC_TEXT = 'Слово дня ждёт. Открой игру — она запустится прямо в Telegram.'

function createBot(configured = true) {
  const commands = new Map<string, TelegramCommandHandler>()
  const sent: Array<{ chatId: string; text: string; button: unknown }> = []
  const menu: Array<{ text: string; url: string }> = []

  const bot = {
    registerCommand: (name: string, _description: string, handler: TelegramCommandHandler) => {
      commands.set(name, handler)
    },
    sendMessage: async (chatId: string, text: string, button?: unknown) => {
      sent.push({ chatId, text, button })
      return true
    },
    setMenuButton: async (text: string, url: string) => {
      menu.push({ text, url })
      return true
    },
    isConfigured: () => configured,
  } as unknown as TelegramBotService

  return { bot, commands, sent, menu }
}

interface ServiceOptions {
  appPublicUrl?: string
  configured?: boolean
  user?: { id: string } | null
  state?: unknown
  stateThrows?: boolean
}

function createService(options: ServiceOptions = {}) {
  const { bot, commands, sent, menu } = createBot(options.configured ?? true)
  const getUserByPlatformId = mock(async () => options.user ?? null)
  const getState = mock(async () => {
    if (options.stateThrows) throw new Error('db down')

    return options.state ?? { status: WordleGameStatus.IN_PROGRESS, attempts: 0, maxAttempts: 6 }
  })

  const service = new WordleMiniAppService(
    bot,
    { getUserByPlatformId } as unknown as UserService,
    { getState } as unknown as WordleService,
    { appPublicUrl: options.appPublicUrl ?? 'https://le-xot.dev' },
  )

  const play = async () => {
    const handler = commands.get('wordle')
    if (!handler) throw new Error('команда /wordle не зарегистрирована')
    await handler(CONTEXT)
  }

  return { service, bot, commands, sent, menu, play, getUserByPlatformId, getState }
}

describe('WordleMiniAppService', () => {
  it('registers the /wordle command', () => {
    const { commands } = createService()

    expect([...commands.keys()]).toEqual(['wordle'])
  })

  it('answers a player without an account with the generic text', async () => {
    const { play, sent, getUserByPlatformId, getState } = createService()

    await play()

    expect(getUserByPlatformId).toHaveBeenCalledWith('TELEGRAM', '7')
    expect(getState).not.toHaveBeenCalled()
    expect(sent[0]).toEqual({
      chatId: '42',
      text: GENERIC_TEXT,
      button: { text: 'Играть', webApp: 'https://le-xot.dev/tg/wordle' },
    })
  })

  it('does not offer the word to someone who already won today', async () => {
    const { play, sent } = createService({
      user: { id: 'user-9' },
      state: { status: WordleGameStatus.WON, attempts: 3, maxAttempts: 6 },
    })

    await play()

    expect(sent[0]?.text).toBe(
      'Сегодняшнее слово угадано с 3-й попытки. Новая партия — после полуночи по Москве.',
    )
  })

  it('reports the end of attempts after a loss', async () => {
    const { play, sent } = createService({
      user: { id: 'user-9' },
      state: { status: WordleGameStatus.LOST, attempts: 6, maxAttempts: 6 },
    })

    await play()

    expect(sent[0]?.text).toBe(
      'Попытки на сегодня закончились. Новая партия — после полуночи по Москве.',
    )
  })

  it('offers to continue a started game', async () => {
    const { play, sent } = createService({
      user: { id: 'user-9' },
      state: { status: WordleGameStatus.IN_PROGRESS, attempts: 2, maxAttempts: 6 },
    })

    await play()

    expect(sent[0]?.text).toBe('Партия идёт: 2 из 6. Продолжи — игра откроется в Telegram.')
  })

  it('keeps the generic text before the first guess', async () => {
    const { play, sent } = createService({
      user: { id: 'user-9' },
      state: { status: WordleGameStatus.IN_PROGRESS, attempts: 0, maxAttempts: 6 },
    })

    await play()

    expect(sent[0]?.text).toBe(GENERIC_TEXT)
  })

  it('falls back to the generic text when the state cannot be read', async () => {
    const { play, sent } = createService({ user: { id: 'user-9' }, stateThrows: true })

    await play()

    expect(sent[0]?.text).toBe(GENERIC_TEXT)
  })

  it('falls back to the site page on http', async () => {
    const { play, sent } = createService({ appPublicUrl: 'http://localhost:5173' })

    await play()

    expect(sent[0]?.button).toEqual({
      text: 'Играть',
      url: 'http://localhost:5173/db/wordle',
    })
  })

  it('sets the menu button when the bot is configured', async () => {
    const { service, menu } = createService()

    await service.onApplicationBootstrap()

    expect(menu).toEqual([{ text: 'Вордли', url: 'https://le-xot.dev/tg/wordle' }])
  })

  it('skips the menu button on http and without configuration', async () => {
    const http = createService({ appPublicUrl: 'http://localhost:5173' })
    await http.service.onApplicationBootstrap()

    const unconfigured = createService({ configured: false })
    await unconfigured.service.onApplicationBootstrap()

    expect(http.menu).toEqual([])
    expect(unconfigured.menu).toEqual([])
  })
})
