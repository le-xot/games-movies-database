import { ImgVariant } from '@backend/modules/img/img.dto'
import { env } from '@backend/utils/enviroments'
import type { GatewayDeps } from '@backend/gateway'
import type { AuthService } from '@backend/modules/auth/auth.service'
import type { AvatarService } from '@backend/modules/avatar/avatar.service'
import type { ImgService } from '@backend/modules/img/img.service'
import type { LimitService } from '@backend/modules/limit/limit.service'
import type { SteamService } from '@backend/modules/steam/steam.service'
import type { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import type { TelegramUpdate } from '@backend/modules/telegram/telegram-bot.types'
import type { TelegramUpdateHandler } from '@backend/modules/telegram/telegram-update.handler'
import type { TelegramService } from '@backend/modules/telegram/telegram.service'
import type { TwirService } from '@backend/modules/twir/twir.service'

export interface IntegrationServices {
  limits: LimitService
  twir: TwirService
  /** Ключ бота TWIR: пустая строка означает «интеграция выключена». */
  twirApiKey: string | undefined
  images: ImgService
  avatars: AvatarService
  steam: SteamService
  auth: AuthService
  telegram: TelegramService
  telegramBot: TelegramBotService
  telegramWebhook: TelegramUpdateHandler
}

/** Внешние интеграции: OAuth, Steam, картинки, лимиты, TWIR. */
export function integrationPorts({
  limits,
  twir,
  twirApiKey,
  images,
  avatars,
  steam,
  auth,
  telegram,
  telegramBot,
  telegramWebhook,
}: IntegrationServices): Pick<
  GatewayDeps,
  | 'limits'
  | 'twir'
  | 'twirApiKey'
  | 'images'
  | 'avatars'
  | 'steam'
  | 'oauth'
  | 'oauthConfig'
  | 'telegramWebhook'
> {
  return {
    limits: {
      change: (input) => limits.changeLimit(input),
    },
    twir: {
      createSuggestion: (input) => twir.createSuggestionWithTwir(input),
    },
    twirApiKey,
    images: {
      getImage: (urlEncoded, variant) =>
        images.getImageContent(
          urlEncoded,
          variant === 'avatar' ? ImgVariant.AVATAR : ImgVariant.POSTER,
        ),
    },
    avatars: {
      getAvatar: (userId) => avatars.getAvatarBuffer(userId),
    },
    steam: {
      getGames: async () => {
        const [games, existing] = await Promise.all([
          steam.getOwnedGames(),
          steam.findDuplicateGames(),
        ])

        return {
          games,
          existingAppIds: games
            .filter((game) => steam.isDuplicate(game, existing))
            .map((game) => String(game.appid)),
        }
      },
      importGames: (games, userId) =>
        steam.importGames(
          games.map((game) => ({
            appId: game.appId,
            status: game.status,
            ...(game.grade !== undefined && game.grade !== null ? { grade: game.grade } : {}),
          })),
          userId,
        ),
    },
    oauth: {
      exchangeTwitch: (code) => auth.handleTwitchCallback(code),
      exchangeKick: (code, verifier) => auth.handleKickCallback(code, verifier),
      linkTwitch: async (userId, code) => {
        await auth.linkTwitchAccount(userId, code)
      },
      linkKick: async (userId, code, verifier) => {
        await auth.linkKickAccount(userId, code, verifier)
      },
      createTelegramRequest: () => telegram.createAuthorizationRequest(),
      exchangeTelegram: (code, verifier) => telegram.exchangeCode(code, verifier),
      loginTelegram: (profile) => auth.handleTelegramOidcLogin(profile),
      linkTelegram: async (userId, profile) => {
        await auth.linkTelegramOidc(userId, profile)
      },
    },
    oauthConfig: {
      twitchClientId: env.TWITCH_CLIENT_ID ?? '',
      twitchCallbackUrl: env.TWITCH_CALLBACK_URL,
      kickClientId: env.KICK_CLIENT_ID ?? '',
      kickCallbackUrl: env.KICK_CALLBACK_URL ?? '',
      telegramCallbackUrl: env.TELEGRAM_CALLBACK_URL,
      production: env.NODE_ENV === 'production',
    },
    telegramWebhook: {
      getWebhookSecret: () => telegramBot.getWebhookSecret(),
      handleUpdate: (update) => telegramWebhook.handle(update as TelegramUpdate),
    },
  }
}
