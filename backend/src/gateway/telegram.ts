import { apiErrorModels, standardErrors } from '@backend/gateway/errors'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { webhookSecretsMatch } from '@backend/modules/telegram/telegram-bot.service'
import { UnauthorizedError } from '@backend/utils/errors'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

export const telegramWebhookModels = {
  TelegramWebhookAck: t.Object({ ok: t.Literal(true) }),
}

export interface TelegramWebhookPort {
  /** Секрет из `TELEGRAM_BOT_WEBHOOK_SECRET`; `null` — вебхук выключен. */
  getWebhookSecret(): string | null
  /** Разбор апдейта. Ошибки не пробрасываются: Telegram иначе зациклит доставку. */
  handleUpdate(update: unknown): Promise<void>
}

export interface TelegramWebhookRouteDeps {
  telegramWebhook: TelegramWebhookPort
  rateLimit: RateLimiter
}

/**
 * Входящий вебхук Telegram Bot API.
 *
 * Путь задаётся в `TELEGRAM_BOT_WEBHOOK_URL` и регистрируется в Bot API из
 * `TelegramBotService.onModuleInit`. Секрет приходит заголовком
 * `x-telegram-bot-api-secret-token` — сравнение в постоянном времени.
 */
export function telegramWebhookRoutes({ telegramWebhook, rateLimit }: TelegramWebhookRouteDeps) {
  const limit = rateLimitGuard(rateLimit)

  return new Elysia({ name: 'telegram-webhook' })
    .model({ ...apiErrorModels, ...telegramWebhookModels })
    .post(
      '/telegram/webhook',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

        const expected = telegramWebhook.getWebhookSecret()
        const header = ctx.request.headers.get('x-telegram-bot-api-secret-token') ?? undefined

        if (!expected || !webhookSecretsMatch(header, expected)) {
          throw new UnauthorizedError()
        }

        await telegramWebhook.handleUpdate(ctx.body ?? {})

        return { ok: true as const }
      },
      {
        response: {
          200: 'TelegramWebhookAck' as const,
          ...standardErrors(),
        },
      },
    )
}
