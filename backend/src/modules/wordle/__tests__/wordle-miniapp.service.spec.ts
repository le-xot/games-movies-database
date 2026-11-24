import { describe, expect, it } from 'bun:test'
import { WordleMiniAppService } from '@backend/modules/wordle/wordle-miniapp.service'
import type { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import type {
  TelegramCommandContext,
  TelegramCommandHandler,
} from '@backend/modules/telegram/telegram-bot.types'

const CONTEXT: TelegramCommandContext = {
  command: 'play',
  payload: null,
  chatId: '42',
  fromId: '7',
  username: 'ivan',
}

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

async function runPlay(commands: Map<string, TelegramCommandHandler>) {
  const handler = commands.get('wordle')
  if (!handler) throw new Error('команда /wordle не зарегистрирована')
  await handler(CONTEXT)
}

describe('WordleMiniAppService', () => {
  it('registers the /wordle command', () => {
    const { bot, commands } = createBot()
    new WordleMiniAppService(bot, { appPublicUrl: 'https://le-xot.dev' })

    expect([...commands.keys()]).toEqual(['wordle'])
  })

  it('opens the Mini App with a web_app button on https', async () => {
    const { bot, commands, sent } = createBot()
    new WordleMiniAppService(bot, { appPublicUrl: 'https://le-xot.dev/' })

    await runPlay(commands)

    expect(sent[0]).toEqual({
      chatId: '42',
      text: 'Слово дня ждёт. Открой игру — она запустится прямо в Telegram.',
      button: { text: 'Играть', webApp: 'https://le-xot.dev/tg/wordle' },
    })
  })

  it('falls back to the site page on http', async () => {
    const { bot, commands, sent } = createBot()
    new WordleMiniAppService(bot, { appPublicUrl: 'http://localhost:5173' })

    await runPlay(commands)

    expect(sent[0]?.button).toEqual({
      text: 'Играть',
      url: 'http://localhost:5173/db/wordle',
    })
  })

  it('sets the menu button when the bot is configured', async () => {
    const { bot, menu } = createBot()
    const service = new WordleMiniAppService(bot, { appPublicUrl: 'https://le-xot.dev' })

    await service.onApplicationBootstrap()

    expect(menu).toEqual([{ text: 'Вордли', url: 'https://le-xot.dev/tg/wordle' }])
  })

  it('skips the menu button on http and without configuration', async () => {
    const http = createBot()
    await new WordleMiniAppService(http.bot, {
      appPublicUrl: 'http://localhost:5173',
    }).onApplicationBootstrap()

    const unconfigured = createBot(false)
    await new WordleMiniAppService(unconfigured.bot, {
      appPublicUrl: 'https://le-xot.dev',
    }).onApplicationBootstrap()

    expect(http.menu).toEqual([])
    expect(unconfigured.menu).toEqual([])
  })
})
