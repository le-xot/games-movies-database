import { Logger } from '@backend/utils/logger'
import type { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import type {
  TelegramCommandContext,
  TelegramUpdate,
} from '@backend/modules/telegram/telegram-bot.types'
import type { TelegramCommandRegistry } from '@backend/modules/telegram/telegram-command.registry'

/**
 * Разбор апдейтов Telegram Bot API и маршрутизация команд.
 *
 * Живёт в домене, а не в гейтвее: HTTP-слой только проверяет секрет вебхука и
 * отдаёт `{ ok: true }`. Ошибки обработчика не пробрасываются наружу — Telegram
 * иначе зациклит повторную доставку одного и того же апдейта.
 */
export class TelegramUpdateHandler {
  private readonly logger = new Logger(TelegramUpdateHandler.name)

  constructor(
    private readonly bot: Pick<TelegramBotService, 'sendMessage'>,
    private readonly registry: TelegramCommandRegistry,
  ) {}

  async handle(update: TelegramUpdate): Promise<void> {
    try {
      await this.dispatch(update)
    } catch (error) {
      this.logger.warn(`Не удалось обработать апдейт Telegram: ${String(error)}`)
    }
  }

  private async dispatch(update: TelegramUpdate): Promise<void> {
    const message = update.message
    const text = message?.text?.trim()
    if (!message || !text || message.chat.type !== 'private' || !text.startsWith('/')) return

    const [rawCommand, ...rest] = text.split(/\s+/)
    if (!rawCommand) return

    const commandName = rawCommand.slice(1).split('@')[0]
    const command = (commandName ?? '').toLowerCase()
    const context: TelegramCommandContext = {
      command,
      payload: rest.join(' ').trim() || null,
      chatId: String(message.chat.id),
      fromId: message.from ? String(message.from.id) : '',
      username: message.from?.username ?? null,
    }

    if (command === 'start' && context.payload) {
      const startPayloadHandler = this.registry.resolveStartPayload()
      if (startPayloadHandler) {
        await startPayloadHandler(context)
        return
      }
    }

    const definition = this.registry.resolve(command)
    if (!definition) {
      await this.bot.sendMessage(context.chatId, this.registry.helpText())
      return
    }

    await definition.handler(context)
  }
}
