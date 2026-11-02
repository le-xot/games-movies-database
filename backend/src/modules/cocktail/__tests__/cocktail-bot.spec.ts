import { describe, expect, it, mock } from 'bun:test'
import { createMock } from '@backend/__tests__/helpers/mock-factory'
import { AccountPlatform } from '@backend/enums'
import {
  OPEN_SITE_BUTTON_TEXT,
  buildConnectRequiredText,
  buildEmptyBarText,
} from '@backend/modules/cocktail/cocktail-bot.messages'
import {
  CocktailBotService,
  type CocktailBotConfig,
} from '@backend/modules/cocktail/cocktail-bot.service'
import { CocktailService } from '@backend/modules/cocktail/cocktail.service'
import { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import { UserService } from '@backend/modules/user/user.service'
import { CocktailMethod } from '@gmdb/contract'
import type { MatchedCocktail } from '@backend/modules/cocktail/cocktail.types'
import type { TelegramCommandHandler } from '@backend/modules/telegram/telegram-bot.types'

const CONFIG: CocktailBotConfig = { appPublicUrl: 'https://example.test' }

interface SentMessage {
  chatId: string
  text: string
  button?: { text: string; url: string }
}

function makeCocktail(overrides: Partial<MatchedCocktail> = {}): MatchedCocktail {
  return {
    id: 'negroni',
    name: 'Негрони',
    method: CocktailMethod.STIR,
    glass: 'Рокс',
    garnish: null,
    note: null,
    sourceName: 'IBA',
    sourceUrl: null,
    ingredients: [],
    missingCore: [],
    missingExtra: [],
    ...overrides,
  }
}

function createService(
  options: {
    user?: { id: string } | null
    bar?: string[]
    results?: MatchedCocktail[]
  } = {},
) {
  const telegram = createMock(TelegramBotService)
  const cocktails = createMock(CocktailService)
  const users = createMock(UserService)
  const sent: SentMessage[] = []

  telegram.sendMessage = mock(
    async (chatId: string, text: string, button?: { text: string; url: string }) => {
      sent.push(button ? { chatId, text, button } : { chatId, text })
      return true
    },
  ) as unknown as TelegramBotService['sendMessage']
  users.getUserByPlatformId = mock(() =>
    Promise.resolve((options.user === undefined ? { id: 'user-1' } : options.user) as never),
  )
  cocktails.getBar = mock(() => Promise.resolve({ ingredientIds: options.bar ?? ['gin'] }))
  cocktails.match = mock(() => Promise.resolve(options.results ?? [makeCocktail()]))

  new CocktailBotService(telegram, cocktails, users, CONFIG)

  return { telegram, cocktails, users, sent }
}

function handler(telegram: TelegramBotService): TelegramCommandHandler {
  const calls = (telegram.registerCommand as unknown as ReturnType<typeof mock>).mock
    .calls as Array<[string, string, TelegramCommandHandler]>
  const entry = calls.find(([name]) => name === 'bar')
  if (!entry) throw new Error('Команда /bar не зарегистрирована')
  return entry[2]
}

async function runBar(telegram: TelegramBotService, payload: string | null): Promise<void> {
  await handler(telegram)({
    command: 'bar',
    payload,
    chatId: '42',
    fromId: '7',
    username: 'ivan',
  })
}

describe('CocktailBotService /bar', () => {
  it('просит привязать аккаунт и ведёт на сайт, если telegram не привязан', async () => {
    const { telegram, cocktails, users, sent } = createService({ user: null })

    await runBar(telegram, null)

    expect(users.getUserByPlatformId).toHaveBeenCalledWith(AccountPlatform.TELEGRAM, '7')
    expect(cocktails.getBar).not.toHaveBeenCalled()
    expect(sent).toEqual([
      {
        chatId: '42',
        text: buildConnectRequiredText(),
        button: { text: OPEN_SITE_BUTTON_TEXT, url: 'https://example.test' },
      },
    ])
  })

  it('говорит про пустой бар и не ищет коктейли', async () => {
    const { telegram, cocktails, sent } = createService({ bar: [] })

    await runBar(telegram, null)

    expect(cocktails.getBar).toHaveBeenCalledWith('user-1')
    expect(cocktails.match).not.toHaveBeenCalled()
    expect(sent).toHaveLength(1)
    expect(sent[0]?.text).toBe(buildEmptyBarText())
  })

  it('показывает до десяти коктейлей и хвост «и ещё N»', async () => {
    const results = Array.from({ length: 12 }, (_, index) =>
      makeCocktail({ id: `c-${index}`, name: `Коктейль ${index + 1}` }),
    )
    const { telegram, cocktails, sent } = createService({ results })

    await runBar(telegram, null)

    expect(cocktails.match).toHaveBeenCalledWith({ ingredientIds: ['gin'], maxMissing: 0 })
    const text = sent[0]?.text ?? ''
    expect(text).toContain('Коктейль 1')
    expect(text).toContain('Коктейль 10')
    expect(text).not.toContain('Коктейль 11')
    expect(text).not.toContain('Коктейль 12')
    expect(text).toContain('и ещё 2')
  })

  it('передаёт /bar 2 в матчинг как maxMissing: 2', async () => {
    const { telegram, cocktails } = createService()

    await runBar(telegram, '2')

    expect(cocktails.match).toHaveBeenCalledWith({ ingredientIds: ['gin'], maxMissing: 2 })
  })

  it('на нечисловой и выходящий за диапазон аргумент отвечает подсказкой по формату', async () => {
    for (const payload of ['abc', '9']) {
      const { telegram, cocktails, sent } = createService()

      await runBar(telegram, payload)

      expect(cocktails.match).not.toHaveBeenCalled()
      expect(cocktails.getBar).not.toHaveBeenCalled()
      expect(sent).toHaveLength(1)
      expect(sent[0]?.text).toContain('/bar 3')
    }
  })

  it('помечает коктейль с отсутствующим EXTRA как «будет хуже»', async () => {
    const { telegram, sent } = createService({
      results: [makeCocktail({ missingExtra: ['Ангостура'] })],
    })

    await runBar(telegram, null)

    expect(sent[0]?.text).toContain('Ангостура')
    expect(sent[0]?.text).toContain('будет хуже')
  })
})
