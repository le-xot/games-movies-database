import {
  MINI_APP_MENU_TEXT,
  buildMiniAppText,
  buildMiniAppUrl,
  isMiniAppUrlSupported,
} from '@backend/modules/wordle/wordle-miniapp.messages'
import {
  PLAY_BUTTON_TEXT,
  buildPlayUrl,
} from '@backend/modules/wordle/wordle-notification.messages'
import type { TelegramButton } from '@backend/modules/telegram/telegram-bot.service'
import type { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import type { TelegramCommandContext } from '@backend/modules/telegram/telegram-bot.types'

export interface WordleMiniAppConfig {
  appPublicUrl: string
}

/**
 * Точка входа в Wordle Mini App: команда `/play` и кнопка меню.
 *
 * Сама игра живёт на сайте — сервис только собирает ссылку и кнопку, поэтому
 * ни запросов, ни состояния у него нет.
 */
export class WordleMiniAppService {
  private readonly appPublicUrl: string
  private readonly miniAppUrl: string

  constructor(
    private readonly telegram: TelegramBotService,
    config: WordleMiniAppConfig,
  ) {
    this.appPublicUrl = config.appPublicUrl
    this.miniAppUrl = buildMiniAppUrl(config.appPublicUrl)

    this.telegram.registerCommand('play', 'Открыть Вордли', (context) => this.handlePlay(context))
  }

  /**
   * Кнопка меню не обязательна: без неё Mini App открывается только командой.
   * Поэтому ошибку не пробрасываем — старт бота не должен от неё зависеть.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.telegram.isConfigured() || !isMiniAppUrlSupported(this.miniAppUrl)) return

    await this.telegram.setMenuButton(MINI_APP_MENU_TEXT, this.miniAppUrl)
  }

  private async handlePlay(context: TelegramCommandContext): Promise<void> {
    await this.telegram.sendMessage(context.chatId, buildMiniAppText(), this.playButton())
  }

  /** В dev адрес на http — Bot API такую кнопку отвергнет, ведём на страницу сайта. */
  private playButton(): TelegramButton {
    if (isMiniAppUrlSupported(this.miniAppUrl)) {
      return { text: PLAY_BUTTON_TEXT, webApp: this.miniAppUrl }
    }

    return { text: PLAY_BUTTON_TEXT, url: buildPlayUrl(this.appPublicUrl) }
  }
}
