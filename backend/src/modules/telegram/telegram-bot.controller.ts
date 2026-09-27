import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import { TelegramBotEvents } from '@/modules/telegram/telegram-bot.events'
import { TelegramBotService, webhookSecretsMatch } from '@/modules/telegram/telegram-bot.service'
import type { TelegramUpdate } from '@/modules/telegram/telegram-bot.types'

const UNKNOWN_COMMAND_REPLY = 'Доступные команды: /start, /stop'
const HANDLED_COMMANDS = new Set(['start', 'stop'])

@Controller('telegram')
export class TelegramBotController {
  private readonly logger = new Logger(TelegramBotController.name)

  constructor(
    private readonly bot: TelegramBotService,
    private readonly events: EventEmitter2,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleUpdate(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: TelegramUpdate,
  ): Promise<{ ok: true }> {
    const expected = this.bot.getWebhookSecret()
    if (!expected || !webhookSecretsMatch(secret, expected)) {
      throw new UnauthorizedException()
    }

    try {
      await this.handleMessage(update)
    } catch (error) {
      this.logger.warn(`Не удалось обработать апдейт Telegram: ${String(error)}`)
    }
    return { ok: true }
  }

  private async handleMessage(update: TelegramUpdate): Promise<void> {
    const message = update.message
    const text = message?.text?.trim()
    if (!message || !text || message.chat.type !== 'private' || !text.startsWith('/')) return

    const [rawCommand, ...rest] = text.split(/\s+/)
    const command = rawCommand.slice(1).split('@')[0].toLowerCase()
    const payload = rest.join(' ').trim() || null
    const chatId = String(message.chat.id)

    if (!HANDLED_COMMANDS.has(command)) {
      await this.bot.sendMessage(chatId, UNKNOWN_COMMAND_REPLY)
      return
    }

    this.events.emit(TelegramBotEvents.COMMAND, {
      command,
      payload,
      chatId,
      fromId: message.from ? String(message.from.id) : '',
      username: message.from?.username ?? null,
    })
  }
}
