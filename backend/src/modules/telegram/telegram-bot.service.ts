import { timingSafeEqual } from 'node:crypto'
import { Logger, type OnModuleInit } from '@nestjs/common'

export const TELEGRAM_API_BASE = 'https://api.telegram.org'
const WEBHOOK_SECRET_PATTERN = /^[A-Za-z0-9_-]{1,256}$/
const SEND_ATTEMPTS = 2
const RETRY_DELAY_MS = 1000

export interface TelegramBotConfig {
  token: string | null
  webhookUrl: string | null
  webhookSecret: string | null
  retryDelayMs?: number
}

export interface TelegramButton {
  text: string
  url: string
}

export function isValidWebhookSecret(secret: string | null | undefined): secret is string {
  return typeof secret === 'string' && WEBHOOK_SECRET_PATTERN.test(secret)
}

export function webhookSecretsMatch(header: string | undefined, expected: string): boolean {
  if (!header) return false
  const headerBytes = Buffer.from(header, 'utf8')
  const expectedBytes = Buffer.from(expected, 'utf8')
  if (headerBytes.length !== expectedBytes.length) return false
  return timingSafeEqual(headerBytes, expectedBytes)
}

export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name)
  private botUsername: string | null = null

  constructor(private readonly config: TelegramBotConfig) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.token &&
      this.config.webhookUrl &&
      isValidWebhookSecret(this.config.webhookSecret),
    )
  }

  getWebhookSecret(): string | null {
    return isValidWebhookSecret(this.config.webhookSecret) ? this.config.webhookSecret : null
  }

  async onModuleInit(): Promise<void> {
    await this.ensureWebhook()
  }

  async sendMessage(chatId: string, text: string, button?: TelegramButton): Promise<boolean> {
    if (!this.config.token) return false
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }
    if (button) {
      body.reply_markup = { inline_keyboard: [[{ text: button.text, url: button.url }]] }
    }

    for (let attempt = 1; attempt <= SEND_ATTEMPTS; attempt += 1) {
      const result = await this.callApi<unknown>('sendMessage', body)
      if (result !== null) return true
      if (attempt < SEND_ATTEMPTS) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelayMs ?? RETRY_DELAY_MS),
        )
      }
    }
    return false
  }

  async getBotUsername(): Promise<string | null> {
    if (this.botUsername) return this.botUsername
    const me = await this.callApi<{ username?: string }>('getMe', {})
    if (me?.username) this.botUsername = me.username
    return this.botUsername
  }

  async ensureWebhook(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log('Telegram-бот не настроен — вебхук не регистрируется')
      return
    }
    const result = await this.callApi<boolean>('setWebhook', {
      url: this.config.webhookUrl,
      secret_token: this.config.webhookSecret,
      allowed_updates: ['message'],
    })
    if (result) this.logger.log('Вебхук Telegram зарегистрирован')
  }

  private async callApi<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
    if (!this.config.token) return null
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}/bot${this.config.token}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await response.json()) as { ok?: boolean; result?: T; description?: string }
      if (!response.ok || !data.ok) {
        this.logger.warn(`Telegram ${method} failed: ${data.description ?? response.status}`)
        return null
      }
      return (data.result ?? null) as T | null
    } catch (error) {
      this.logger.warn(`Telegram ${method} error: ${String(error)}`)
      return null
    }
  }
}
