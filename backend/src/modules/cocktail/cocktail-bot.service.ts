import { AccountPlatform } from '@backend/enums'
import {
  OPEN_SITE_BUTTON_TEXT,
  buildBarMessage,
  buildConnectRequiredText,
  buildEmptyBarText,
  buildFormatHintText,
} from './cocktail-bot.messages'
import type { CocktailService } from './cocktail.service'
import type { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import type { TelegramCommandContext } from '@backend/modules/telegram/telegram-bot.types'
import type { UserService } from '@backend/modules/user/user.service'

/** Больше трёх недостающих CORE-ингредиентов бармен уже не докупит «по пути». */
export const MAX_MISSING = 3

export interface CocktailBotConfig {
  appPublicUrl: string
}

export type ParsedMaxMissing = { ok: true; value: number } | { ok: false }

/**
 * Разбор аргумента `/bar`: без аргумента — докупка 0, иначе только целое `0..3`.
 *
 * Дробь, нечисло и выход за диапазон — повод показать подсказку по формату;
 * матчинг в этом случае не вызывается.
 */
export function parseMaxMissing(payload: string | null): ParsedMaxMissing {
  const raw = payload?.trim() ?? ''
  if (raw === '') return { ok: true, value: 0 }
  if (!/^\d$/.test(raw)) return { ok: false }

  const value = Number(raw)
  if (value > MAX_MISSING) return { ok: false }

  return { ok: true, value }
}

/** Тонкая команда `/bar`: ни состояния, ни колбэков — только чтение бара и ответ. */
export class CocktailBotService {
  private readonly appPublicUrl: string

  constructor(
    private readonly telegram: TelegramBotService,
    private readonly cocktails: CocktailService,
    private readonly users: UserService,
    config: CocktailBotConfig,
  ) {
    this.appPublicUrl = config.appPublicUrl
    this.telegram.registerCommand('bar', 'Коктейли из твоего бара', (context) =>
      this.handleBar(context),
    )
  }

  private async handleBar(context: TelegramCommandContext): Promise<void> {
    const parsed = parseMaxMissing(context.payload)
    if (!parsed.ok) {
      await this.telegram.sendMessage(context.chatId, buildFormatHintText())
      return
    }

    const user = context.fromId
      ? await this.users.getUserByPlatformId(AccountPlatform.TELEGRAM, context.fromId)
      : null
    if (!user) {
      await this.telegram.sendMessage(context.chatId, buildConnectRequiredText(), {
        text: OPEN_SITE_BUTTON_TEXT,
        url: this.appPublicUrl,
      })
      return
    }

    const bar = await this.cocktails.getBar(user.id)
    if (bar.ingredientIds.length === 0) {
      await this.telegram.sendMessage(context.chatId, buildEmptyBarText(), {
        text: OPEN_SITE_BUTTON_TEXT,
        url: this.appPublicUrl,
      })
      return
    }

    const results = await this.cocktails.match({
      ingredientIds: bar.ingredientIds,
      maxMissing: parsed.value,
    })
    await this.telegram.sendMessage(context.chatId, buildBarMessage(results, parsed.value))
  }
}
