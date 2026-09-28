import { Logger, type OnApplicationBootstrap } from '@nestjs/common'
import { TelegramBotService } from '@/modules/telegram/telegram-bot.service'
import type {
  TelegramCommandDefinition,
  TelegramCommandHandler,
  TelegramMenuItem,
} from '@/modules/telegram/telegram-bot.types'

export const TELEGRAM_COMMAND_NAME_PATTERN = /^[a-z0-9_]{1,32}$/

export const TELEGRAM_HELP_HEADER = 'Вот что я умею:'

export class TelegramCommandRegistry implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramCommandRegistry.name)
  private readonly commands = new Map<string, TelegramCommandDefinition>()
  private startPayloadHandler: TelegramCommandHandler | null = null

  constructor(private readonly bot: TelegramBotService) {
    this.register({
      name: 'start',
      description: 'Показать приветствие и список команд',
      handler: (context) => this.sendHelp(context.chatId),
    })
    this.register({
      name: 'help',
      description: 'Показать список команд',
      handler: (context) => this.sendHelp(context.chatId),
    })
  }

  register(definition: TelegramCommandDefinition): void {
    const { name, description } = definition
    if (!TELEGRAM_COMMAND_NAME_PATTERN.test(name)) {
      throw new Error(`Недопустимое имя команды Telegram: «${name}»`)
    }
    if (description.trim().length === 0) {
      throw new Error(`Пустое описание команды «${name}»`)
    }
    if (this.commands.has(name)) {
      throw new Error(`Команда «${name}» уже зарегистрирована`)
    }
    this.commands.set(name, definition)
  }

  registerStartPayload(handler: TelegramCommandHandler): void {
    if (this.startPayloadHandler) {
      throw new Error('Обработчик start-payload уже зарегистрирован')
    }
    this.startPayloadHandler = handler
  }

  resolve(name: string): TelegramCommandDefinition | undefined {
    return this.commands.get(name)
  }

  resolveStartPayload(): TelegramCommandHandler | null {
    return this.startPayloadHandler
  }

  menu(): TelegramMenuItem[] {
    return [...this.commands.values()].map(({ name, description }) => ({
      command: name,
      description,
    }))
  }

  helpText(): string {
    const lines = [...this.commands.values()].map(
      ({ name, description }) => `/${name} — ${description}`,
    )
    return `${TELEGRAM_HELP_HEADER}\n\n${lines.join('\n')}`
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.bot.isConfigured()) {
      this.logger.log('Telegram-бот не настроен — меню команд не регистрируется')
      return
    }
    await this.bot.setMyCommands(this.menu())
  }

  private async sendHelp(chatId: string): Promise<void> {
    await this.bot.sendMessage(chatId, this.helpText())
  }
}
