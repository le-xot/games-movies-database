import { describe, expect, it, mock } from 'bun:test'
import { TelegramCommandRegistry } from '@/modules/telegram/telegram-command.registry'
import type { TelegramCommandContext } from '@/modules/telegram/telegram-bot.types'

const CONTEXT: TelegramCommandContext = {
  command: 'wordle',
  payload: null,
  chatId: '42',
  fromId: '7',
  username: 'ivan',
}

const NOOP = () => {}

function createRegistry() {
  const bot = {
    isConfigured: mock(() => true),
    sendMessage: mock(() => Promise.resolve(true)),
    setMyCommands: mock(() => Promise.resolve(true)),
  }
  const registry = new TelegramCommandRegistry(bot as never)
  return { registry, bot }
}

describe('TelegramCommandRegistry', () => {
  it('builds the help text from the registered commands', () => {
    const { registry } = createRegistry()
    registry.register({ name: 'wordle', description: 'Включить напоминания', handler: NOOP })

    expect(registry.helpText()).toBe(
      'Вот что я умею:\n\n' +
        '/start — Показать приветствие и список команд\n' +
        '/help — Показать список команд\n' +
        '/wordle — Включить напоминания',
    )
  })

  it('replies with the help text for the built-in start and help commands', async () => {
    const { registry, bot } = createRegistry()
    registry.register({ name: 'wordle', description: 'Включить напоминания', handler: NOOP })

    await registry.resolve('help')?.handler(CONTEXT)

    const [chatId, text] = (bot.sendMessage as ReturnType<typeof mock>).mock.calls[0] as [
      string,
      string,
    ]
    expect(chatId).toBe('42')
    expect(text).toContain('/wordle — Включить напоминания')
  })

  it('returns undefined for an unknown command', () => {
    const { registry } = createRegistry()

    expect(registry.resolve('nope')).toBeUndefined()
  })

  it('keeps the registration order for the Telegram menu', () => {
    const { registry } = createRegistry()
    registry.register({ name: 'wordle', description: 'Включить напоминания', handler: NOOP })

    expect(registry.menu()).toEqual([
      { command: 'start', description: 'Показать приветствие и список команд' },
      { command: 'help', description: 'Показать список команд' },
      { command: 'wordle', description: 'Включить напоминания' },
    ])
  })

  it('rejects a duplicate command name', () => {
    const { registry } = createRegistry()
    registry.register({ name: 'wordle', description: 'Первая', handler: NOOP })

    expect(() =>
      registry.register({ name: 'wordle', description: 'Вторая', handler: NOOP }),
    ).toThrow()
  })

  it('rejects command names Telegram would not accept', () => {
    const { registry } = createRegistry()

    for (const name of ['Wordle', 'wordle-off', 'wordle off', '', 'a'.repeat(33), 'слово']) {
      expect(() => registry.register({ name, description: 'Тест', handler: NOOP })).toThrow()
    }
  })

  it('rejects an empty command description', () => {
    const { registry } = createRegistry()

    expect(() => registry.register({ name: 'wordle', description: '   ', handler: NOOP })).toThrow()
  })

  it('allows only one start payload handler', () => {
    const { registry } = createRegistry()
    const first = NOOP
    registry.registerStartPayload(first)

    expect(registry.resolveStartPayload()).toBe(first)
    expect(() => registry.registerStartPayload(NOOP)).toThrow()
  })

  it('pushes the menu to Telegram on bootstrap', async () => {
    const { registry, bot } = createRegistry()
    registry.register({ name: 'wordle', description: 'Включить напоминания', handler: NOOP })

    await registry.onApplicationBootstrap()

    expect(bot.setMyCommands).toHaveBeenCalledWith([
      { command: 'start', description: 'Показать приветствие и список команд' },
      { command: 'help', description: 'Показать список команд' },
      { command: 'wordle', description: 'Включить напоминания' },
    ])
  })

  it('skips the menu when the bot is not configured', async () => {
    const { registry, bot } = createRegistry()
    bot.isConfigured = mock(() => false)

    await registry.onApplicationBootstrap()

    expect(bot.setMyCommands).not.toHaveBeenCalled()
  })
})
