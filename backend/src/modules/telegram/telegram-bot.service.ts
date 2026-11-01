import { timingSafeEqual } from 'node:crypto'
import { Logger } from '@backend/utils/logger'
import { CommandGroup } from '@grammyjs/commands'
import { Bot, type CommandContext, type Context } from 'grammy'
import type {
  TelegramCommandContext,
  TelegramCommandHandler,
  TelegramMenuItem,
  TelegramStartHandler,
} from '@backend/modules/telegram/telegram-bot.types'
import type { Update, UserFromGetMe } from 'grammy/types'

export const TELEGRAM_HELP_HEADER = 'Вот что я умею:'

const WEBHOOK_SECRET_PATTERN = /^[A-Za-z0-9_-]{1,256}$/
const SEND_ATTEMPTS = 2
const RETRY_DELAY_MS = 1000

/**
 * Заглушка токена для незаданного `TELEGRAM_BOT_TOKEN`.
 *
 * grammY не даёт создать `Bot` с пустым токеном, а бот должен существовать
 * всегда: иначе регистрация команд и рассылки разъедутся по условиям.
 * Настоящие запросы к Bot API отсекает `isConfigured()`.
 */
const UNCONFIGURED_TOKEN = '0:unconfigured'

export interface TelegramBotConfig {
  token: string | null
  webhookUrl: string | null
  webhookSecret: string | null
  retryDelayMs?: number
  /** Подмена транспорта: тесты и прокси. По умолчанию — fetch из grammY. */
  fetch?: typeof fetch
  /** Готовая информация о боте; в рантайме её подтягивает `bot.init()`. */
  botInfo?: UserFromGetMe
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

/**
 * Бот на grammY.
 *
 * Транспорт и роутинг команд — grammY (`bot.handleUpdate`, `bot.command`);
 * наружу торчит доменный `TelegramCommandContext`, чтобы модули не зависели от
 * фреймворка. Вебхук регистрируется на старте, меню команд — на bootstrap.
 */
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name)
  private readonly bot: Bot
  private readonly commands = new CommandGroup()
  private readonly startHandlers: TelegramStartHandler[] = []
  private botUsername: string | null = null

  constructor(private readonly config: TelegramBotConfig) {
    this.bot = new Bot(config.token ?? UNCONFIGURED_TOKEN, {
      ...(config.fetch ? { client: { fetch: config.fetch } } : {}),
      ...(config.botInfo ? { botInfo: config.botInfo } : {}),
    })

    // Приватные чаты — единственное место, где бот отвечает: в группах он
    // молчит, чтобы не спамить.
    const privateChats = this.bot.chatType('private')
    privateChats.use(this.commands)
    privateChats.on('message:text', async (ctx) => {
      if (!ctx.message.text.startsWith('/')) return
      await this.sendHelp(String(ctx.chat.id))
    })

    this.bot.catch((error) => {
      this.logger.warn(`Не удалось обработать апдейт Telegram: ${String(error)}`)
    })

    this.registerCommand('start', 'Показать приветствие и список команд', async (context) => {
      if (context.payload && (await this.runStartPayload(context))) return
      await this.sendHelp(context.chatId)
    })
    this.registerCommand('help', 'Показать список команд', async (context) => {
      await this.sendHelp(context.chatId)
    })
  }

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

  /**
   * Регистрирует команду в grammY и в меню бота.
   *
   * Имя и описание уходят в `setMyCommands`, поэтому команда сразу появляется
   * в подсказках Telegram и в `/help`.
   */
  registerCommand(name: string, description: string, handler: TelegramCommandHandler): void {
    this.commands.command(name, description, async (ctx) => {
      await handler(this.toCommandContext(name, ctx))
    })
  }

  /** Обработчик `/start <payload>`: вызывается, пока кто-нибудь не заберёт payload. */
  registerStartHandler(handler: TelegramStartHandler): void {
    this.startHandlers.push(handler)
  }

  helpText(): string {
    const lines = this.commands
      .toElementals('default')
      .map(({ command, description }) => `/${command} — ${description}`)

    return `${TELEGRAM_HELP_HEADER}\n\n${lines.join('\n')}`
  }

  menu(): TelegramMenuItem[] {
    return this.commands
      .toElementals('default')
      .map(({ command, description }) => ({ command, description }))
  }

  async onModuleInit(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log('Telegram-бот не настроен — вебхук не регистрируется')
      return
    }

    try {
      // Без init() у контекста нет `me`, и команда с суффиксом `@bot` падает.
      await this.bot.init()
    } catch (error) {
      this.logger.warn(`Telegram init failed: ${String(error)}`)
    }

    await this.ensureWebhook()
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log('Telegram-бот не настроен — меню команд не регистрируется')
      return
    }

    try {
      // `commands.setCommands` шлёт в Bot API лишние поля (`hasHandler`),
      // поэтому меню собираем сами из тех же дескрипторов.
      await this.bot.api.setMyCommands(this.menu())
    } catch (error) {
      this.logger.warn(`Telegram setMyCommands failed: ${String(error)}`)
    }
  }

  async sendMessage(chatId: string, text: string, button?: TelegramButton): Promise<boolean> {
    if (!this.config.token) return false

    for (let attempt = 1; attempt <= SEND_ATTEMPTS; attempt += 1) {
      try {
        await this.bot.api.sendMessage(chatId, text, {
          link_preview_options: { is_disabled: true },
          ...(button
            ? { reply_markup: { inline_keyboard: [[{ text: button.text, url: button.url }]] } }
            : {}),
        })

        return true
      } catch (error) {
        this.logger.warn(`Telegram sendMessage failed: ${String(error)}`)

        if (attempt < SEND_ATTEMPTS) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelayMs ?? RETRY_DELAY_MS),
          )
        }
      }
    }

    return false
  }

  async getBotUsername(): Promise<string | null> {
    if (this.botUsername) return this.botUsername
    if (this.bot.isInited()) {
      this.botUsername = this.bot.botInfo.username
      return this.botUsername
    }

    try {
      const me = await this.bot.api.getMe()
      if (me.username) this.botUsername = me.username
    } catch (error) {
      this.logger.warn(`Telegram getMe failed: ${String(error)}`)
    }

    return this.botUsername
  }

  async ensureWebhook(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log('Telegram-бот не настроен — вебхук не регистрируется')
      return
    }

    try {
      await this.bot.api.setWebhook(this.config.webhookUrl as string, {
        secret_token: this.config.webhookSecret as string,
        allowed_updates: ['message', 'callback_query'],
      })
      this.logger.log('Вебхук Telegram зарегистрирован')
    } catch (error) {
      this.logger.warn(`Telegram setWebhook failed: ${String(error)}`)
    }
  }

  /**
   * Разбор входящего апдейта.
   *
   * Ошибки не пробрасываются: Telegram иначе зациклит повторную доставку
   * одного и того же апдейта.
   */
  async handleUpdate(update: unknown): Promise<void> {
    try {
      await this.bot.handleUpdate(update as Update)
    } catch (error) {
      this.logger.warn(`Не удалось обработать апдейт Telegram: ${String(error)}`)
    }
  }

  private async runStartPayload(context: TelegramCommandContext): Promise<boolean> {
    for (const handler of this.startHandlers) {
      if (await handler(context)) return true
    }

    return false
  }

  private async sendHelp(chatId: string): Promise<void> {
    await this.sendMessage(chatId, this.helpText())
  }

  private toCommandContext(name: string, ctx: CommandContext<Context>): TelegramCommandContext {
    return {
      command: name,
      payload: ctx.match.trim() || null,
      chatId: String(ctx.chat?.id ?? ''),
      fromId: ctx.from ? String(ctx.from.id) : '',
      username: ctx.from?.username ?? null,
    }
  }
}
