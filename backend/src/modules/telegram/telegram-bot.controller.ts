import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import { TelegramBotService, webhookSecretsMatch } from '@/modules/telegram/telegram-bot.service'
import { TelegramCommandRegistry } from '@/modules/telegram/telegram-command.registry'
import { ApiErrors } from '@/utils/api-errors'
import type { TelegramCommandContext, TelegramUpdate } from '@/modules/telegram/telegram-bot.types'

@ApiErrors()
@Controller('telegram')
export class TelegramBotController {
  private readonly logger = new Logger(TelegramBotController.name)

  constructor(
    private readonly bot: TelegramBotService,
    private readonly registry: TelegramCommandRegistry,
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
