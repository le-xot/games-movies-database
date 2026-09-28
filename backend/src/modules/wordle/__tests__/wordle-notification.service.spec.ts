import { describe, expect, it, mock, spyOn } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { WordleGameStatus } from '@/enums'
import { TelegramBotService } from '@/modules/telegram/telegram-bot.service'
import { TelegramCommandRegistry } from '@/modules/telegram/telegram-command.registry'
import { UserService } from '@/modules/user/user.service'
import { DrizzleWordleNotificationRepository } from '@/modules/wordle/repositories/drizzle-wordle-notification.repository'
import { DrizzleWordleRepository } from '@/modules/wordle/repositories/drizzle-wordle.repository'
import {
  WordleNotificationService,
  type WordleNotificationConfig,
} from '@/modules/wordle/wordle-notification.service'
import type { RedisClient } from 'bun'

const NOW = new Date('2026-09-20T10:00:00.000Z') // 13:00 MSK
const YESTERDAY = '2026-09-19'

const CONFIG: WordleNotificationConfig = {
  appPublicUrl: 'https://example.test',
  morningRaw: '12:00',
  eveningRaw: '20:00',
}

type SentCall = [string, string, { text: string; url: string }?]

function sentCalls(telegram: TelegramBotService): SentCall[] {
  return (telegram.sendMessage as unknown as ReturnType<typeof mock>).mock.calls as SentCall[]
}

function makeSubscription(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    userId: 'user-1',
    chatId: '42',
    telegramUsername: 'ivan',
    morningEnabled: true,
    eveningEnabled: true,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    ...overrides,
  }
}

function makeGame(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'game-1',
    userId: 'user-1',
    date: YESTERDAY,
    answer: 'слово',
    guesses: ['слово'],
    status: WordleGameStatus.WON,
    createdAt: new Date('2026-09-19T10:00:00Z'),
    ...overrides,
  }
}

function createService() {
  const telegram = createMock(TelegramBotService)
  const registry = new TelegramCommandRegistry(telegram)
  const notifications = createMock(DrizzleWordleNotificationRepository)
  const wordle = createMock(DrizzleWordleRepository)
  const users = createMock(UserService)
  const redis: { send: (command: string, args: string[]) => Promise<unknown> } = {
    send: () => Promise.resolve('OK'),
  }
  const service = new WordleNotificationService(
    telegram,
    registry,
    notifications,
    wordle,
    users,
    redis as unknown as RedisClient,
    CONFIG,
  )
  return { service, telegram, registry, notifications, wordle, users, redis }
}

function commandHandler(registry: TelegramCommandRegistry, name: string) {
  const definition = registry.resolve(name)
  if (!definition) throw new Error(`Команда ${name} не зарегистрирована`)
  return definition.handler
}

function stubAudience(
  notifications: DrizzleWordleNotificationRepository,
  telegram: TelegramBotService,
  options: {
    subscriptions?: unknown[]
    winners?: string[]
    finished?: string[]
    games?: unknown[]
    send?: (chatId: string, text: string) => Promise<boolean>
  } = {},
) {
  notifications.findAll = mock(() =>
    Promise.resolve((options.subscriptions ?? [makeSubscription()]) as never),
  )
  notifications.findUserIdsWonOnDate = mock(() => Promise.resolve(options.winners ?? ['user-1']))
  notifications.findUserIdsFinishedOnDate = mock(() => Promise.resolve(options.finished ?? []))
  notifications.findFinishedGamesByUserIds = mock(() =>
    Promise.resolve((options.games ?? [makeGame()]) as never),
  )
  telegram.sendMessage = mock(options.send ?? (() => Promise.resolve(true)))
}

describe('WordleNotificationService.runSlot', () => {
  it('sends the morning text with the streak to winners without a finished game', async () => {
    const { service, notifications, telegram, redis } = createService()
    redis.send = mock((command: string) => Promise.resolve(command === 'EXISTS' ? 0 : 'OK'))
    stubAudience(notifications, telegram, {
      subscriptions: [
        makeSubscription(),
        makeSubscription({ id: 2, userId: 'user-2', chatId: '43' }),
      ],
      winners: ['user-1', 'user-2'],
      finished: ['user-2'],
      games: [makeGame()],
    })

    await service.runSlot('morning', NOW)

    expect(telegram.sendMessage).toHaveBeenCalledTimes(1)
    const [chatId, text] = sentCalls(telegram)[0] as SentCall
    expect(chatId).toBe('42')
    expect(text).toContain('Уже 1 день подряд в серии')
  })

  it('skips a disabled slot', async () => {
    const { service, notifications, telegram } = createService()
    stubAudience(notifications, telegram, {
      subscriptions: [makeSubscription({ morningEnabled: false })],
    })

    await service.runSlot('morning', NOW)

    expect(telegram.sendMessage).not.toHaveBeenCalled()
  })

  it('does not send twice for the same slot and date', async () => {
    const { service, notifications, telegram, redis } = createService()
    redis.send = mock((command: string) => Promise.resolve(command === 'EXISTS' ? 1 : 'OK'))
    stubAudience(notifications, telegram)

    await service.runSlot('morning', NOW)

    expect(telegram.sendMessage).not.toHaveBeenCalled()
  })

  it('marks the dedup key only after a successful send', async () => {
    const { service, notifications, telegram, redis } = createService()
    const sent: string[][] = []
    redis.send = mock((command: string, args: string[]) => {
      if (command === 'EXISTS') return Promise.resolve(0)
      sent.push(args)
      return Promise.resolve('OK')
    })
    stubAudience(notifications, telegram)

    await service.runSlot('morning', NOW)

    expect(sent).toEqual([['wordle:notify:morning:2026-09-20:user-1', '1', 'EX', '259200']])
  })

  it('does not mark the dedup key when the send fails', async () => {
    const { service, notifications, telegram, redis } = createService()
    const commands: string[] = []
    redis.send = mock((command: string) => {
      commands.push(command)
      return Promise.resolve(command === 'EXISTS' ? 0 : 'OK')
    })
    stubAudience(notifications, telegram, { send: () => Promise.resolve(false) })

    await service.runSlot('morning', NOW)

    expect(commands).toEqual(['EXISTS'])
  })

  it('keeps sending to other recipients when one fails', async () => {
    const { service, notifications, telegram } = createService()
    stubAudience(notifications, telegram, {
      subscriptions: [
        makeSubscription(),
        makeSubscription({ id: 2, userId: 'user-2', chatId: '43' }),
      ],
      winners: ['user-1', 'user-2'],
      games: [makeGame(), makeGame({ id: 'game-2', userId: 'user-2' })],
      send: (chatId) => {
        if (chatId === '42') return Promise.reject(new Error('boom'))
        return Promise.resolve(true)
      },
    })

    await service.runSlot('morning', NOW)

    expect(telegram.sendMessage).toHaveBeenCalledTimes(2)
  })
})

describe('WordleNotificationService scheduler', () => {
  it('runs the morning catch-up during the day and schedules the next slot', async () => {
    const { service, telegram } = createService()
    telegram.isConfigured = mock(() => true)
    const spy = spyOn(service, 'runSlot').mockResolvedValue()

    await service.handleStartup(new Date('2026-09-20T10:00:00.000Z')) // 13:00 MSK

    expect(spy).toHaveBeenCalledWith('morning', expect.anything())
    expect(service['timer']).not.toBeNull()
    service.onModuleDestroy()
    expect(service['timer']).toBeNull()
  })

  it('runs the evening catch-up after the evening slot', async () => {
    const { service, telegram } = createService()
    telegram.isConfigured = mock(() => true)
    const spy = spyOn(service, 'runSlot').mockResolvedValue()

    await service.handleStartup(new Date('2026-09-20T18:00:00.000Z')) // 21:00 MSK

    expect(spy).toHaveBeenCalledWith('evening', expect.anything())
    service.onModuleDestroy()
  })

  it('does not catch up after 23:30 MSK', async () => {
    const { service, telegram } = createService()
    telegram.isConfigured = mock(() => true)
    const spy = spyOn(service, 'runSlot').mockResolvedValue()

    await service.handleStartup(new Date('2026-09-20T20:45:00.000Z')) // 23:45 MSK

    expect(spy).not.toHaveBeenCalled()
    expect(service['timer']).not.toBeNull()
    service.onModuleDestroy()
  })

  it('does not start when the bot is not configured', () => {
    const { service, telegram } = createService()
    telegram.isConfigured = mock(() => false)

    service.onModuleInit()

    expect(service['timer']).toBeNull()
  })

  it('keeps scheduling after a failed catch-up run', async () => {
    const { service, telegram } = createService()
    telegram.isConfigured = mock(() => true)
    spyOn(service, 'runSlot').mockImplementation(() => Promise.reject(new Error('db down')))

    await expect(
      service.handleStartup(new Date('2026-09-20T10:00:00.000Z')),
    ).resolves.toBeUndefined()

    expect(service['timer']).not.toBeNull()
    service.onModuleDestroy()
  })

  it('keeps scheduling after a failed timer run', async () => {
    const { service, telegram } = createService()
    telegram.isConfigured = mock(() => true)
    service['pendingSlot'] = 'morning'
    spyOn(service, 'runSlot').mockImplementation(() => Promise.reject(new Error('db down')))

    await expect(service['handleTimer']()).resolves.toBeUndefined()

    expect(service['timer']).not.toBeNull()
    service.onModuleDestroy()
  })
})

describe('WordleNotificationService commands', () => {
  it('registers the wordle commands in the bot menu', () => {
    const { registry } = createService()

    expect(registry.menu()).toEqual([
      { command: 'start', description: 'Показать приветствие и список команд' },
      { command: 'help', description: 'Показать список команд' },
      { command: 'wordle', description: 'Включить напоминания про Вордли' },
      { command: 'wordle_off', description: 'Выключить напоминания про Вордли' },
    ])
  })

  it('binds a chat with a valid start token', async () => {
    const { registry, telegram, notifications, users, redis } = createService()
    redis.send = mock(() => Promise.resolve('user-1'))
    users.getUserById = mock(() => Promise.resolve({ id: 'user-1' } as never))
    telegram.sendMessage = mock(() => Promise.resolve(true))
    const handler = registry.resolveStartPayload()
    if (!handler) throw new Error('Обработчик start-payload не зарегистрирован')

    await handler({
      command: 'start',
      payload: 'token-1',
      chatId: '42',
      fromId: '7',
      username: 'ivan',
    })

    expect(notifications.upsert).toHaveBeenCalledWith({
      userId: 'user-1',
      chatId: '42',
      telegramUsername: 'ivan',
    })
    const text = sentCalls(telegram)[0]?.[1]
    expect(text).toContain('12:00 и 20:00')
  })

  it('reports an expired link token', async () => {
    const { registry, telegram, notifications, redis } = createService()
    redis.send = mock(() => Promise.resolve(null))
    const handler = registry.resolveStartPayload()
    if (!handler) throw new Error('Обработчик start-payload не зарегистрирован')

    await handler({
      command: 'start',
      payload: 'stale',
      chatId: '42',
      fromId: '7',
      username: null,
    })

    expect(notifications.upsert).not.toHaveBeenCalled()
    const text = sentCalls(telegram)[0]?.[1]
    expect(text).toContain('устарела')
  })

  it('auto-matches a telegram login by platform id', async () => {
    const { registry, telegram, notifications, users } = createService()
    users.getUserByPlatformId = mock(() => Promise.resolve({ id: 'user-9' } as never))
    telegram.sendMessage = mock(() => Promise.resolve(true))

    await commandHandler(
      registry,
      'wordle',
    )({
      command: 'wordle',
      payload: null,
      chatId: '42',
      fromId: '7',
      username: null,
    })

    expect(users.getUserByPlatformId).toHaveBeenCalledWith('TELEGRAM', '7')
    expect(notifications.upsert).toHaveBeenCalledWith({
      userId: 'user-9',
      chatId: '42',
      telegramUsername: null,
    })
  })

  it('explains how to connect when there is no account match', async () => {
    const { registry, telegram, users } = createService()
    users.getUserByPlatformId = mock(() => Promise.resolve(null))

    await commandHandler(
      registry,
      'wordle',
    )({
      command: 'wordle',
      payload: null,
      chatId: '42',
      fromId: '7',
      username: null,
    })

    const [chatId, text, button] = sentCalls(telegram)[0] as SentCall
    expect(chatId).toBe('42')
    expect(text).toContain('зайди на сайт через Telegram')
    expect(button).toEqual({ text: 'Открыть сайт', url: 'https://example.test' })
  })

  it('unbinds on wordle_off and reports when there was nothing to unbind', async () => {
    const { registry, telegram, notifications } = createService()
    notifications.findByChatId = mock(() =>
      Promise.resolve({ userId: 'user-1', chatId: '42' } as never),
    )

    await commandHandler(
      registry,
      'wordle_off',
    )({
      command: 'wordle_off',
      payload: null,
      chatId: '42',
      fromId: '7',
      username: null,
    })

    expect(notifications.deleteByChatId).toHaveBeenCalledWith('42')

    notifications.findByChatId = mock(() => Promise.resolve(null))
    await commandHandler(
      registry,
      'wordle_off',
    )({
      command: 'wordle_off',
      payload: null,
      chatId: '42',
      fromId: '7',
      username: null,
    })
    const texts = sentCalls(telegram).map((call) => call[1])
    expect(texts.some((text) => text.includes('и так выключены'))).toBe(true)
  })

  it('creates a one-time deep link', async () => {
    const { service, telegram, redis } = createService()
    telegram.isConfigured = mock(() => true)
    telegram.getBotUsername = mock(() => Promise.resolve('wordle_bot'))
    const sets: string[][] = []
    redis.send = mock((command: string, args: string[]) => {
      if (command === 'SET') sets.push(args)
      return Promise.resolve('OK')
    })

    const result = await service.createLink('user-1')

    expect(result.url).toMatch(/^https:\/\/t\.me\/wordle_bot\?start=/)
    expect(sets[0]?.[0]).toMatch(/^wordle:notify:link:/)
    expect(sets[0]?.[1]).toBe('user-1')
    expect(sets[0]?.[2]).toBe('EX')
    expect(sets[0]?.[3]).toBe('600')
  })

  it('rejects link creation when the bot is not configured', async () => {
    const { service, telegram } = createService()
    telegram.isConfigured = mock(() => false)

    await expect(service.createLink('user-1')).rejects.toThrow('Уведомления недоступны')
  })

  it('returns status defaults and the stored subscription', async () => {
    const { service, notifications, telegram } = createService()
    telegram.isConfigured = mock(() => true)
    notifications.findByUserId = mock(() => Promise.resolve(null))

    const empty = await service.getStatus('user-1')
    expect(empty).toEqual({
      available: true,
      connected: false,
      telegramUsername: null,
      morningEnabled: true,
      eveningEnabled: true,
      morningTime: '12:00',
      eveningTime: '20:00',
    })

    notifications.findByUserId = mock(() =>
      Promise.resolve({
        userId: 'user-1',
        chatId: '42',
        telegramUsername: 'ivan',
        morningEnabled: false,
        eveningEnabled: true,
      } as never),
    )
    const connected = await service.getStatus('user-1')
    expect(connected.connected).toBe(true)
    expect(connected.morningEnabled).toBe(false)
  })

  it('throws when updating flags without a subscription', async () => {
    const { service, notifications } = createService()
    notifications.updateFlags = mock(() => Promise.resolve(null))

    await expect(service.updateFlags('user-1', { morningEnabled: false })).rejects.toThrow(
      'Подписка не найдена',
    )
  })

  it('deletes the subscription on disconnect', async () => {
    const { service, notifications } = createService()
    await service.disconnect('user-1')
    expect(notifications.deleteByUserId).toHaveBeenCalledWith('user-1')
  })
})
