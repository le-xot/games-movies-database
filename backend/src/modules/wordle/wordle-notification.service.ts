import { randomBytes } from 'node:crypto'
import {
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AccountPlatform, WordleGameStatus } from '@/enums'
import {
  TelegramBotEvents,
  type TelegramBotCommandPayload,
} from '@/modules/telegram/telegram-bot.events'
import { TelegramBotService } from '@/modules/telegram/telegram-bot.service'
import { UserService } from '@/modules/user/user.service'
import { DrizzleWordleNotificationRepository } from '@/modules/wordle/repositories/drizzle-wordle-notification.repository'
import { DrizzleWordleRepository } from '@/modules/wordle/repositories/drizzle-wordle.repository'
import {
  WordleNotificationsLinkDTO,
  WordleNotificationsStatusDTO,
  WordleNotificationsUpdateDTO,
} from '@/modules/wordle/wordle-notification.dto'
import {
  PLAY_BUTTON_TEXT,
  buildConnectedText,
  buildEveningText,
  buildMorningText,
  buildPlayUrl,
} from '@/modules/wordle/wordle-notification.messages'
import {
  formatSlotTime,
  nextSlotAt,
  pickCatchUpSlot,
  resolveSlots,
  type SlotName,
  type Slots,
} from '@/modules/wordle/wordle-notification.schedule'
import { getMoscowDateKey } from '@/modules/wordle/wordle.date'
import { computeWordleStats } from '@/modules/wordle/wordle.stats'
import type { RedisClient } from 'bun'

const DAY_MS = 24 * 60 * 60 * 1000
export const DEDUP_TTL_SECONDS = 259_200
export const DEDUP_KEY_PREFIX = 'wordle:notify'
export const LINK_KEY_PREFIX = 'wordle:notify:link'
export const LINK_TTL_SECONDS = 600

export interface WordleNotificationConfig {
  appPublicUrl: string
  morningRaw: string | null
  eveningRaw: string | null
}

export interface WordleNotificationRecipient {
  userId: string
  chatId: string
  streak: number
}

export class WordleNotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WordleNotificationService.name)
  private readonly appPublicUrl: string
  private readonly slots: Slots
  private timer: ReturnType<typeof setTimeout> | null = null
  private pendingSlot: SlotName | null = null

  constructor(
    private readonly telegram: TelegramBotService,
    private readonly notifications: DrizzleWordleNotificationRepository,
    private readonly wordle: DrizzleWordleRepository,
    private readonly users: UserService,
    private readonly redis: RedisClient,
    config: WordleNotificationConfig,
  ) {
    this.appPublicUrl = config.appPublicUrl
    this.slots = resolveSlots(config.morningRaw, config.eveningRaw, (message) =>
      this.logger.warn(message),
    )
  }

  async runSlot(slot: SlotName, now: Date = new Date()): Promise<void> {
    const today = getMoscowDateKey(now)
    const yesterday = getMoscowDateKey(new Date(now.getTime() - DAY_MS))
    const recipients = await this.collectRecipients(slot, today, yesterday)

    if (recipients.length === 0) {
      this.logger.log(`Слот «${slot}» (${today}): получателей нет`)
      return
    }

    const results = await Promise.allSettled(
      recipients.map((recipient) => this.sendTo(recipient, slot, today)),
    )
    const sent = results.filter((result) => result.status === 'fulfilled' && result.value).length
    const failed = results.filter((result) => result.status === 'rejected').length
    this.logger.log(
      `Слот «${slot}» (${today}): получателей ${recipients.length}, отправлено ${sent}, ошибок ${failed}`,
    )
  }

  async collectRecipients(
    slot: SlotName,
    today: string,
    yesterday: string,
  ): Promise<WordleNotificationRecipient[]> {
    const subscriptions = await this.notifications.findAll()
    const enabled = subscriptions.filter((subscription) =>
      slot === 'morning' ? subscription.morningEnabled : subscription.eveningEnabled,
    )
    if (enabled.length === 0) return []

    const [winners, finishedToday] = await Promise.all([
      this.notifications.findUserIdsWonOnDate(yesterday),
      this.notifications.findUserIdsFinishedOnDate(today),
    ])
    const winnerIds = new Set(winners)
    const finishedIds = new Set(finishedToday)
    const candidates = enabled.filter(
      (subscription) => winnerIds.has(subscription.userId) && !finishedIds.has(subscription.userId),
    )
    if (candidates.length === 0) return []

    const games = await this.notifications.findFinishedGamesByUserIds(
      candidates.map((subscription) => subscription.userId),
    )
    const gamesByUser = new Map<
      string,
      { date: string; status: WordleGameStatus; attempts: number }[]
    >()
    for (const game of games) {
      const list = gamesByUser.get(game.userId) ?? []
      list.push({ date: game.date, status: game.status, attempts: game.guesses.length })
      gamesByUser.set(game.userId, list)
    }

    const recipients: WordleNotificationRecipient[] = []
    for (const subscription of candidates) {
      const streak = computeWordleStats(
        gamesByUser.get(subscription.userId) ?? [],
        today,
      ).currentStreak
      if (streak > 0) {
        recipients.push({
          userId: subscription.userId,
          chatId: subscription.chatId,
          streak,
        })
      }
    }
    return recipients
  }

  private async sendTo(
    recipient: WordleNotificationRecipient,
    slot: SlotName,
    today: string,
  ): Promise<boolean> {
    const key = this.dedupKey(slot, today, recipient.userId)
    if (await this.wasSent(key)) return false

    const text =
      slot === 'morning' ? buildMorningText(recipient.streak) : buildEveningText(recipient.streak)
    const ok = await this.telegram.sendMessage(recipient.chatId, text, {
      text: PLAY_BUTTON_TEXT,
      url: buildPlayUrl(this.appPublicUrl),
    })
    if (ok) await this.markSent(key)
    return ok
  }

  private dedupKey(slot: SlotName, date: string, userId: string): string {
    return `${DEDUP_KEY_PREFIX}:${slot}:${date}:${userId}`
  }

  private async wasSent(key: string): Promise<boolean> {
    try {
      return (await this.redis.send('EXISTS', [key])) === 1
    } catch (error) {
      this.logger.warn(`Redis недоступен, дедуп пропущен: ${String(error)}`)
      return false
    }
  }

  private async markSent(key: string): Promise<void> {
    try {
      await this.redis.send('SET', [key, '1', 'EX', String(DEDUP_TTL_SECONDS)])
    } catch (error) {
      this.logger.warn(`Redis недоступен, отметка отправки не сохранена: ${String(error)}`)
    }
  }

  onModuleInit(): void {
    if (!this.telegram.isConfigured()) {
      this.logger.log('Telegram-уведомления выключены: не задан полный TELEGRAM_BOT_* конфиг')
      return
    }
    void this.handleStartup().catch((error) => {
      this.logger.error(`Startup-прогон уведомлений не удался: ${String(error)}`)
    })
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  async handleStartup(now: Date = new Date()): Promise<void> {
    try {
      const catchUp = pickCatchUpSlot(now, this.slots)
      if (catchUp) await this.runSlot(catchUp, now)
    } catch (error) {
      this.logger.error(`Catch-up уведомлений не удался: ${String(error)}`)
    } finally {
      this.scheduleNext(now)
    }
  }

  scheduleNext(now: Date = new Date()): void {
    if (this.timer) clearTimeout(this.timer)
    const next = nextSlotAt(now, this.slots)
    this.pendingSlot = next.slot
    this.timer = setTimeout(() => {
      void this.handleTimer()
    }, next.at.getTime() - now.getTime())
    this.logger.log(`Следующий слот «${next.slot}»: ${next.at.toISOString()}`)
  }

  private async handleTimer(): Promise<void> {
    const slot = this.pendingSlot
    if (!slot) return
    try {
      await this.runSlot(slot)
    } catch (error) {
      this.logger.error(`Прогон слота «${slot}» не удался: ${String(error)}`)
    } finally {
      this.scheduleNext()
    }
  }

  @OnEvent(TelegramBotEvents.COMMAND)
  async handleCommand(command: TelegramBotCommandPayload): Promise<void> {
    if (command.command === 'start') {
      await this.handleStart(command)
      return
    }
    if (command.command === 'stop') {
      await this.handleStop(command.chatId)
    }
  }

  async createLink(userId: string): Promise<WordleNotificationsLinkDTO> {
    if (!this.telegram.isConfigured()) {
      throw new ServiceUnavailableException('Уведомления недоступны')
    }
    const username = await this.telegram.getBotUsername()
    if (!username) {
      throw new ServiceUnavailableException('Не удалось получить имя бота')
    }
    const token = randomBytes(32).toString('base64url')
    try {
      await this.redis.send('SET', [
        `${LINK_KEY_PREFIX}:${token}`,
        userId,
        'EX',
        String(LINK_TTL_SECONDS),
      ])
    } catch (error) {
      this.logger.warn(`Redis недоступен при создании ссылки: ${String(error)}`)
      throw new ServiceUnavailableException('Не удалось создать ссылку, попробуйте позже')
    }
    return { url: `https://t.me/${username}?start=${token}` }
  }

  async getStatus(userId: string): Promise<WordleNotificationsStatusDTO> {
    const subscription = await this.notifications.findByUserId(userId)
    return {
      available: this.telegram.isConfigured(),
      connected: Boolean(subscription),
      telegramUsername: subscription?.telegramUsername ?? null,
      morningEnabled: subscription?.morningEnabled ?? true,
      eveningEnabled: subscription?.eveningEnabled ?? true,
      morningTime: formatSlotTime(this.slots.morning),
      eveningTime: formatSlotTime(this.slots.evening),
    }
  }

  async updateFlags(
    userId: string,
    flags: WordleNotificationsUpdateDTO,
  ): Promise<WordleNotificationsStatusDTO> {
    const updated = await this.notifications.updateFlags(userId, {
      morningEnabled: flags.morningEnabled,
      eveningEnabled: flags.eveningEnabled,
    })
    if (!updated) throw new NotFoundException('Подписка не найдена')
    return this.getStatus(userId)
  }

  async disconnect(userId: string): Promise<void> {
    await this.notifications.deleteByUserId(userId)
  }

  private async handleStart(command: TelegramBotCommandPayload): Promise<void> {
    if (command.payload) {
      const userId = await this.consumeLinkToken(command.payload)
      const user = userId ? await this.users.getUserById(userId) : null
      if (!user) {
        await this.telegram.sendMessage(
          command.chatId,
          'Ссылка устарела — сгенерируй новую в настройках аккаунта.',
        )
        return
      }
      await this.bind(command, user.id)
      return
    }

    const user = command.fromId
      ? await this.users.getUserByPlatformId(AccountPlatform.TELEGRAM, command.fromId)
      : null
    if (!user) {
      await this.telegram.sendMessage(
        command.chatId,
        `Привет! Подключить уведомления можно в аккаунте: ${this.appPublicUrl}`,
      )
      return
    }
    await this.bind(command, user.id)
  }

  private async bind(command: TelegramBotCommandPayload, userId: string): Promise<void> {
    await this.notifications.upsert({
      userId,
      chatId: command.chatId,
      telegramUsername: command.username,
    })
    await this.telegram.sendMessage(
      command.chatId,
      buildConnectedText(formatSlotTime(this.slots.morning), formatSlotTime(this.slots.evening)),
    )
  }

  private async handleStop(chatId: string): Promise<void> {
    const existing = await this.notifications.findByChatId(chatId)
    if (!existing) {
      await this.telegram.sendMessage(chatId, 'Уведомления и так выключены.')
      return
    }
    await this.notifications.deleteByChatId(chatId)
    await this.telegram.sendMessage(
      chatId,
      'Уведомления отключены. Включить снова — в настройках аккаунта.',
    )
  }

  private async consumeLinkToken(token: string): Promise<string | null> {
    try {
      const value = await this.redis.send('GETDEL', [`${LINK_KEY_PREFIX}:${token}`])
      return typeof value === 'string' && value.length > 0 ? value : null
    } catch (error) {
      this.logger.warn(`Redis недоступен при проверке токена: ${String(error)}`)
      return null
    }
  }
}
