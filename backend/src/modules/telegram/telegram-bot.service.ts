import { timingSafeEqual } from 'node:crypto'
import { Logger } from '@backend/utils/logger'
import { CommandGroup } from '@grammyjs/commands'
import { Bot, BotError, type CommandContext, type Context } from 'grammy'
import type {
  TelegramCommandContext,
  TelegramCommandHandler,
  TelegramMenuItem,
  TelegramStartHandler,
} from '@backend/modules/telegram/telegram-bot.types'
import type { Update, UserFromGetMe } from 'grammy/types'

export const TELEGRAM_HELP_HEADER = 'Вот что я умею:'

const WEBHOOK_SECRET_PATTERN = /^[A-Za-z0-9_-]{1,256}$/
/** Ограничения Bot API на команду: иначе `setMyCommands` отвергнет весь список. */
const COMMAND_NAME_PATTERN = /^[a-z0-9_]{1,32}$/
const MAX_COMMAND_DESCRIPTION_LENGTH = 256
const SEND_ATTEMPTS = 2
const RETRY_DELAY_MS = 1000
const API_TIMEOUT_MS = 15_000
const INIT_TIMEOUT_MS = 10_000

/**
 * Заглушка токена для незаданного `TELEGRAM_BOT_TOKEN`.
 *
 * grammY не даёт создать `Bot` с пустым токеном, а бот должен существовать
 * всегда: иначе регистрация команд и рассылки разъедутся по условиям.
 * Настоящие запросы к Bot API отсекает `isConfigured()`.
 */
const UNCONFIGURED_TOKEN = '0:unconfigured'

/**
 * grammY типизирует `signal` через `abort-controller`, но рантайм-то один:
 * стандартный `AbortSignal` из Bun/Node он принимает как есть.
 */
type TelegramSignal = Parameters<Bot['api']['setWebhook']>[2]

function apiSignal(timeoutMs: number): TelegramSignal {
  return AbortSignal.timeout(timeoutMs) as TelegramSignal
}

export interface TelegramBotConfig {
  token: string | null
  webhookUrl: string | null
  webhookSecret: string | null
  retryDelayMs?: number
  /** Таймаут одного вызова Bot API; по умолчанию 15 с. */
  apiTimeoutMs?: number
  /** Предел на `bot.init()` (он ретраит сетевые ошибки без счёта); по умолчанию 10 с. */
  initTimeoutMs?: number
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
  private readonly commands = new CommandGroup({ ignoreCase: true })
  private readonly startHandlers: TelegramStartHandler[] = []
  private readonly registeredCommands = new Set<string>()
  private initPromise: Promise<boolean> | null = null
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

  /**
   * Секрет отдаётся только полностью настроенному боту: иначе вебхук
   * подтверждал бы апдейты, которые некому обработать, и Telegram считал бы
   * их доставленными. Без секрета роут отвечает 401, и доставка повторится.
   */
  getWebhookSecret(): string | null {
    if (!this.isConfigured()) return null
    return isValidWebhookSecret(this.config.webhookSecret) ? this.config.webhookSecret : null
  }

  /**
   * Регистрирует команду в grammY и в меню бота.
   *
   * Имя и описание уходят в `setMyCommands`, поэтому команда сразу появляется
   * в подсказках Telegram и в `/help`. Кривой дескриптор не роняет старт, но и
   * не попадает в меню: Bot API отвергает весь список целиком.
   */
  registerCommand(name: string, description: string, handler: TelegramCommandHandler): void {
    if (!COMMAND_NAME_PATTERN.test(name)) {
      this.logger.warn(`Команда «${name}» не зарегистрирована: имя не подходит под Bot API`)
      return
    }
    if (description.trim().length === 0 || description.length > MAX_COMMAND_DESCRIPTION_LENGTH) {
      this.logger.warn(`Команда «${name}» не зарегистрирована: недопустимое описание`)
      return
    }
    if (this.registeredCommands.has(name)) {
      this.logger.warn(`Команда «${name}» уже зарегистрирована — повтор пропущен`)
      return
    }

    this.registeredCommands.add(name)
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
    if (!(await this.ensureInitialized())) {
      this.logger.log('Telegram-бот не инициализирован — вебхук не регистрируется')
      return
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
      await this.bot.api.setMyCommands(
        this.menu(),
        undefined,
        apiSignal(this.config.apiTimeoutMs ?? API_TIMEOUT_MS),
      )
    } catch (error) {
      this.logger.warn(`Telegram setMyCommands failed: ${this.describeError(error)}`)
    }
  }

  /**
   * Отправка сообщения. Токен — единственное, что нужно для исходящих:
   * рассылка живёт отдельно от вебхука, поэтому `isConfigured()` здесь ни при чём.
   */
  async sendMessage(chatId: string, text: string, button?: TelegramButton): Promise<boolean> {
    if (!this.config.token) return false

    for (let attempt = 1; attempt <= SEND_ATTEMPTS; attempt += 1) {
      try {
        await this.bot.api.sendMessage(
          chatId,
          text,
          {
            link_preview_options: { is_disabled: true },
            ...(button
              ? { reply_markup: { inline_keyboard: [[{ text: button.text, url: button.url }]] } }
              : {}),
          },
          apiSignal(this.config.apiTimeoutMs ?? API_TIMEOUT_MS),
        )

        return true
      } catch (error) {
        this.logger.warn(`Telegram sendMessage failed: ${this.describeError(error)}`)

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
      const me = await this.bot.api.getMe(apiSignal(this.config.apiTimeoutMs ?? API_TIMEOUT_MS))
      if (me.username) this.botUsername = me.username
    } catch (error) {
      this.logger.warn(`Telegram getMe failed: ${this.describeError(error)}`)
    }

    return this.botUsername
  }

  async ensureWebhook(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.log('Telegram-бот не настроен — вебхук не регистрируется')
      return
    }

    try {
      await this.bot.api.setWebhook(
        this.config.webhookUrl as string,
        {
          secret_token: this.config.webhookSecret as string,
          allowed_updates: ['message', 'callback_query'],
        },
        apiSignal(this.config.apiTimeoutMs ?? API_TIMEOUT_MS),
      )
      this.logger.log('Вебхук Telegram зарегистрирован')
    } catch (error) {
      this.logger.warn(`Telegram setWebhook failed: ${this.describeError(error)}`)
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
      // Первый апдейт после неудачного старта сам поднимет инициализацию:
      // вебхук уже может быть зарегистрирован с прошлого запуска.
      if (!this.bot.isInited() && this.isConfigured()) {
        await this.ensureInitialized()
      }

      await this.bot.handleUpdate(update as Update)
    } catch (error) {
      this.logUpdateError(error)
    }
  }

  /**
   * Инициализация бота (без неё grammY не разбирает апдейты — нет `me`).
   *
   * Ограничена таймаутом и дедуплицирована: grammY ретраит сетевые ошибки без
   * предела попыток, а `container.init()` не должен ждать вечно — сайт обязан
   * подняться даже без Telegram. Неудачная попытка не запоминается: следующий
   * апдейт попробует снова.
   */
  private ensureInitialized(): Promise<boolean> {
    if (this.bot.isInited()) return Promise.resolve(true)
    if (!this.isConfigured()) return Promise.resolve(false)

    if (!this.initPromise) {
      this.initPromise = this.bot
        .init(apiSignal(this.config.initTimeoutMs ?? INIT_TIMEOUT_MS))
        .then(() => true)
        .catch((error) => {
          this.logger.warn(`Telegram init failed: ${this.describeError(error)}`)
          return false
        })
        .finally(() => {
          this.initPromise = null
        })
    }

    return this.initPromise
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

  private logUpdateError(error: unknown): void {
    if (error instanceof BotError) {
      this.logger.warn(
        `Апдейт ${error.ctx.update.update_id} не обработан: ${this.describeError(error.error)}`,
      )
      return
    }

    this.logger.warn(`Не удалось обработать апдейт Telegram: ${this.describeError(error)}`)
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
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
