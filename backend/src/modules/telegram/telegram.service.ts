import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { env } from '@/utils/enviroments'
import { TelegramAuthStore } from './telegram-auth.store'
import {
  TELEGRAM_API_BASE,
  TELEGRAM_CANCELLED_MESSAGE,
  TELEGRAM_LINK_DONE_MESSAGE,
  TELEGRAM_LOGIN_DONE_MESSAGE,
  TELEGRAM_POLL_RETRY_MS,
  TELEGRAM_POLL_TIMEOUT_SECONDS,
  TELEGRAM_STALE_LINK_MESSAGE,
} from './telegram.constants'
import {
  buildTelegramAuthKeyboard,
  formatTelegramAuthPrompt,
  mapTelegramProfile,
  parseCallbackData,
  parseStartToken,
} from './telegram.utils'
import type {
  TelegramAuthMode,
  TelegramAuthRecord,
  TelegramCallbackQuery,
  TelegramInlineKeyboardMarkup,
  TelegramPhotoSize,
  TelegramUpdate,
} from './telegram.types'

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name)
  private botUsername: string | null = null
  private offset = 0
  private running = false
  private readonly abortController = new AbortController()

  constructor(private readonly store: TelegramAuthStore) {}

  get isConfigured(): boolean {
    return Boolean(env.TELEGRAM_BOT_TOKEN)
  }

  async onModuleInit(): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set, Telegram auth is disabled')
      return
    }

    try {
      await this.call('deleteWebhook', { drop_pending_updates: true })
      const me = await this.call<{ username?: string }>('getMe', {})
      if (!me.username) throw new Error('Telegram bot has no username')
      this.botUsername = me.username
      this.running = true
      void this.pollLoop()
      this.logger.log(`Telegram bot @${me.username} polling started`)
    } catch (error) {
      this.logger.error(`Telegram bot initialization failed: ${String(error)}`)
    }
  }

  onModuleDestroy(): void {
    this.running = false
    this.abortController.abort()
  }

  assertConfigured(): void {
    if (!this.isConfigured || !this.botUsername) {
      throw new HttpException('Telegram auth is not configured', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  buildStartLink(token: string): string {
    this.assertConfigured()
    return `https://t.me/${this.botUsername}?start=${token}`
  }

  createAuthToken(mode: TelegramAuthMode, userId?: string, origin?: string): Promise<string> {
    return this.store.create(mode, userId, origin)
  }

  getAuthToken(token: string): Promise<TelegramAuthRecord | null> {
    return this.store.get(token)
  }

  consumeAuthToken(token: string): Promise<TelegramAuthRecord | null> {
    return this.store.consume(token)
  }

  async resolvePhotoUrl(telegramUserId: number): Promise<string | null> {
    try {
      const photos = await this.call<{ photos: TelegramPhotoSize[][] }>('getUserProfilePhotos', {
        user_id: telegramUserId,
        limit: 1,
      })
      const sizes = photos.photos?.[0]
      if (!sizes?.length) return null

      const largest = [...sizes].sort((a, b) => b.width - a.width)[0]
      if (!largest) return null

      const file = await this.call<{ file_path?: string }>('getFile', { file_id: largest.file_id })
      if (!file.file_path) return null

      return `${TELEGRAM_API_BASE}/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
    } catch (error) {
      this.logger.warn(`Failed to resolve Telegram profile photo: ${String(error)}`)
      return null
    }
  }

  private async pollLoop(): Promise<void> {
    while (this.running) {
      try {
        const updates = await this.call<TelegramUpdate[]>('getUpdates', {
          offset: this.offset,
          timeout: TELEGRAM_POLL_TIMEOUT_SECONDS,
          allowed_updates: ['message', 'callback_query'],
        })

        for (const update of updates) {
          this.offset = update.update_id + 1
          await this.handleUpdate(update)
        }
      } catch (error) {
        if (!this.running) return
        this.logger.warn(`Telegram polling failed: ${String(error)}`)
        await Bun.sleep(TELEGRAM_POLL_RETRY_MS)
      }
    }
  }

  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query)
      return
    }

    const message = update.message
    if (!message || message.chat.type !== 'private' || !message.from) return

    const token = parseStartToken(message.text ?? '')
    if (!token) return

    const record = await this.store.get(token)
    if (!record) {
      await this.sendMessage(message.chat.id, TELEGRAM_STALE_LINK_MESSAGE)
      return
    }

    await this.sendMessage(
      message.chat.id,
      formatTelegramAuthPrompt(record),
      buildTelegramAuthKeyboard(token),
    )
  }

  private async handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
    const parsed = query.data ? parseCallbackData(query.data) : null
    const chatId = query.message?.chat.id
    const messageId = query.message?.message_id

    if (!parsed || chatId === undefined || messageId === undefined) {
      await this.answerCallbackQuery(query.id, 'Неизвестное действие')
      return
    }

    const record = await this.store.get(parsed.token)
    if (!record) {
      await this.answerCallbackQuery(query.id, 'Ссылка устарела')
      await this.editMessage(chatId, messageId, TELEGRAM_STALE_LINK_MESSAGE)
      return
    }

    if (parsed.action === 'cancel') {
      await this.answerCallbackQuery(query.id, 'Отменено')
      await this.store.remove(parsed.token)
      await this.editMessage(chatId, messageId, TELEGRAM_CANCELLED_MESSAGE)
      return
    }

    if (record.status === 'confirmed') {
      await this.answerCallbackQuery(query.id, 'Уже подтверждено')
      await this.editMessage(chatId, messageId, this.doneMessage(record.mode))
      return
    }

    await this.answerCallbackQuery(query.id, 'Подтверждено')
    const photoUrl = await this.resolvePhotoUrl(query.from.id)
    const confirmed = await this.store.confirm(
      parsed.token,
      mapTelegramProfile(query.from, photoUrl),
    )
    if (!confirmed) {
      await this.editMessage(chatId, messageId, TELEGRAM_STALE_LINK_MESSAGE)
      return
    }

    await this.editMessage(chatId, messageId, this.doneMessage(record.mode))
  }

  private doneMessage(mode: TelegramAuthMode): string {
    return mode === 'link' ? TELEGRAM_LINK_DONE_MESSAGE : TELEGRAM_LOGIN_DONE_MESSAGE
  }

  private async sendMessage(
    chatId: number,
    text: string,
    replyMarkup?: TelegramInlineKeyboardMarkup,
  ): Promise<void> {
    try {
      await this.call('sendMessage', { chat_id: chatId, text, reply_markup: replyMarkup })
    } catch (error) {
      this.logger.warn(`Failed to send Telegram message: ${String(error)}`)
    }
  }

  private async answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
    try {
      await this.call('answerCallbackQuery', { callback_query_id: callbackQueryId, text })
    } catch (error) {
      this.logger.warn(`Failed to answer Telegram callback query: ${String(error)}`)
    }
  }

  private async editMessage(chatId: number, messageId: number, text: string): Promise<void> {
    try {
      await this.call('editMessageText', { chat_id: chatId, message_id: messageId, text })
    } catch (error) {
      this.logger.warn(`Failed to edit Telegram message: ${String(error)}`)
    }
  }

  private async call<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout((TELEGRAM_POLL_TIMEOUT_SECONDS + 10) * 1000),
    })

    const data = (await response.json()) as { ok: boolean; result?: T; description?: string }

    if (!response.ok || !data.ok) {
      throw new Error(`Telegram API ${method} failed: ${data.description ?? response.status}`)
    }

    return data.result as T
  }
}
