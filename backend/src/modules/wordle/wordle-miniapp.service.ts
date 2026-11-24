import { AccountPlatform } from '@backend/enums'
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
import { Logger } from '@backend/utils/logger'
import type { TelegramButton } from '@backend/modules/telegram/telegram-bot.service'
import type { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import type { TelegramCommandContext } from '@backend/modules/telegram/telegram-bot.types'
import type { UserService } from '@backend/modules/user/user.service'
import type { WordleService } from '@backend/modules/wordle/wordle.service'

export interface WordleMiniAppConfig {
  appPublicUrl: string
}

/**
 * Точка входа в Wordle Mini App: команда `/wordle` и кнопка меню.
 *
 * Сама игра живёт на сайте — сервис только собирает ссылку и кнопку, поэтому
 * ни запросов, ни состояния у него нет.
 */
export class WordleMiniAppService {
  private readonly logger = new Logger(WordleMiniAppService.name)
  private readonly appPublicUrl: string
  private readonly miniAppUrl: string

  constructor(
    private readonly telegram: TelegramBotService,
    private readonly users: UserService,
    private readonly wordle: WordleService,
    config: WordleMiniAppConfig,
  ) {
    this.appPublicUrl = config.appPublicUrl
    this.miniAppUrl = buildMiniAppUrl(config.appPublicUrl)

    this.telegram.registerCommand('wordle', 'Играть в Вордли', (context) =>
      this.handlePlay(context),
    )
  }

  /**
   * Кнопка меню не обязательна: без неё Mini App открывается только командой.
   * Поэтому ошибку не пробрасываем — старт бота не должен от неё зависеть.
   */
  async onApplicationBootstrap(): Promise<void> {
    // Пропуск логируем: иначе «кнопки нет» никак не отличить от «вызов упал».
    if (!this.telegram.isConfigured()) {
      this.logger.log('Mini App: бот не настроен — кнопка меню не ставится')
      return
    }
    if (!isMiniAppUrlSupported(this.miniAppUrl)) {
      this.logger.warn(`Mini App: адрес не https (${this.miniAppUrl}) — кнопка меню не ставится`)
      return
    }

    await this.telegram.setMenuButton(MINI_APP_MENU_TEXT, this.miniAppUrl)
  }

  private async handlePlay(context: TelegramCommandContext): Promise<void> {
    await this.telegram.sendMessage(
      context.chatId,
      await this.resolveText(context),
      this.playButton(),
    )
  }

  /**
   * Текст по сегодняшней партии игрока.
   *
   * Telegram id ищем в привязанных аккаунтах, игрока без аккаунта трактуем как
   * нового. Любая ошибка чтения не должна оставлять человека без ответа —
   * тогда отдаём нейтральный текст.
   */
  private async resolveText(context: TelegramCommandContext): Promise<string> {
    if (!context.fromId) return buildMiniAppText(null)

    try {
      const user = await this.users.getUserByPlatformId(AccountPlatform.TELEGRAM, context.fromId)
      if (!user) return buildMiniAppText(null)

      return buildMiniAppText(await this.wordle.getState(user.id))
    } catch (error) {
      this.logger.warn(`Mini App: не удалось прочитать состояние партии: ${String(error)}`)
      return buildMiniAppText(null)
    }
  }

  /** В dev адрес на http — Bot API такую кнопку отвергнет, ведём на страницу сайта. */
  private playButton(): TelegramButton {
    if (isMiniAppUrlSupported(this.miniAppUrl)) {
      return { text: PLAY_BUTTON_TEXT, webApp: this.miniAppUrl }
    }

    return { text: PLAY_BUTTON_TEXT, url: buildPlayUrl(this.appPublicUrl) }
  }
}
