import { createGateway, type GatewayDeps } from '@backend/gateway'

const EMPTY_STATS = {
  total: 0,
  byGenre: [],
  byStatus: [],
  byGrade: [],
  byFriendsGrade: [],
  byGenreStatus: [],
  byGenreGrade: [],
  byFriendsGenreGrade: [],
}

/**
 * Гейтвей с заглушками на всё, что не важно конкретному тесту. Каждый тест
 * переопределяет только то, что проверяет.
 */
export function createTestGateway(overrides: Partial<GatewayDeps> = {}) {
  return createGateway({
    weather: { getWeatherData: async () => null },
    stats: { getRecordsStats: async () => EMPTY_STATS },
    queue: { getQueue: async () => ({ games: [], videos: [] }) },
    likes: {
      createLike: async () => {
        throw new Error('createLike не заглушен')
      },
      deleteLike: async () => {
        throw new Error('deleteLike не заглушен')
      },
      getLikesByRecordId: async () => ({ likes: [], total: 0 }),
      getLikesByUserId: async () => ({ likes: [], total: 0 }),
      getLikes: async () => ({ likes: [], total: 0 }),
    },
    records: {
      createFromLink: async () => {
        throw new Error('createFromLink не заглушен')
      },
      findById: async () => {
        throw new Error('findById не заглушен')
      },
      patch: async () => {
        throw new Error('patch не заглушен')
      },
      updatePoster: async () => {
        throw new Error('updatePoster не заглушен')
      },
      remove: async () => {
        throw new Error('remove не заглушен')
      },
      getAll: async () => ({ records: [], total: 0 }),
    },
    ratings: {
      rate: async () => {
        throw new Error('rate не заглушен')
      },
      unrate: async () => {
        throw new Error('unrate не заглушен')
      },
      getMy: async () => ({ items: [], total: 0 }),
      getUser: async () => ({ items: [], total: 0 }),
      getFriends: async () => ({ members: [] }),
    },
    users: {
      getAll: async () => [],
      getById: async () => null,
      getAccounts: async () => [],
      remove: async () => {},
      merge: async () => ({
        accountsMoved: 0,
        accountsDropped: 0,
        likesMoved: 0,
        likesDropped: 0,
        ratingsMoved: 0,
        ratingsDropped: 0,
        suggestionsMoved: 0,
        wordleGamesMoved: 0,
        wordleGamesDropped: 0,
      }),
    },
    suggestions: {
      list: async () => [],
      create: async () => ({ title: '', genre: 'GAME' }),
      remove: async () => {},
    },
    limits: {
      change: async (input) => input,
    },
    twir: {
      createSuggestion: async () => ({ title: '', genre: 'GAME' }),
    },
    twirApiKey: undefined,
    images: {
      getImage: async () => ({ buffer: new Uint8Array(), contentType: 'image/webp' }),
    },
    avatars: {
      getAvatar: async () => null,
    },
    steam: {
      getGames: async () => ({ games: [], existingAppIds: [] }),
      importGames: async () => ({ created: [], failed: [] }),
    },
    oauth: {
      exchangeTwitch: async () => {
        throw new Error('exchangeTwitch не заглушен')
      },
      exchangeKick: async () => {
        throw new Error('exchangeKick не заглушен')
      },
      linkTwitch: async () => {},
      linkKick: async () => {},
      createTelegramRequest: () => ({
        url: 'https://t.me/auth',
        state: 'state',
        codeVerifier: 'verifier',
      }),
      exchangeTelegram: async () => {
        throw new Error('exchangeTelegram не заглушен')
      },
      loginTelegram: async () => {
        throw new Error('loginTelegram не заглушен')
      },
      linkTelegram: async () => {},
    },
    oauthConfig: {
      twitchClientId: 'twitch-client',
      twitchCallbackUrl: 'http://localhost/api/auth/twitch/callback',
      kickClientId: 'kick-client',
      kickCallbackUrl: 'http://localhost/api/auth/kick/callback',
      telegramCallbackUrl: 'http://localhost/auth/callback/telegram',
      production: false,
    },
    authSession: {
      getAccounts: async () => [],
      unlinkAccount: async () => {},
      updateLogin: async () => {
        throw new Error('updateLogin не заглушен')
      },
      updateCustomization: async () => {
        throw new Error('updateCustomization не заглушен')
      },
      deleteUser: async () => {},
      uploadAvatar: async () => {
        throw new Error('uploadAvatar не заглушен')
      },
      deleteAvatar: async () => {
        throw new Error('deleteAvatar не заглушен')
      },
    },
    wordle: {
      getState: async () => {
        throw new Error('getState не заглушен')
      },
      makeGuess: async () => {
        throw new Error('makeGuess не заглушен')
      },
      getStats: async () => {
        throw new Error('getStats не заглушен')
      },
      getLeaderboard: async () => {
        throw new Error('getLeaderboard не заглушен')
      },
      getPracticeState: async () => null,
      startPractice: async () => {
        throw new Error('startPractice не заглушен')
      },
      makePracticeGuess: async () => {
        throw new Error('makePracticeGuess не заглушен')
      },
    },
    wordleNotifications: {
      getStatus: async () => {
        throw new Error('getStatus не заглушен')
      },
      updateFlags: async () => {
        throw new Error('updateFlags не заглушен')
      },
      createLink: async () => ({ url: '' }),
      disconnect: async () => {},
    },
    telegramWebhook: {
      getWebhookSecret: () => null,
      handleUpdate: async () => {},
    },
    auth: { resolve: async () => null },
    rateLimit: { hit: async () => ({ allowed: true, retryAfterSeconds: 0 }) },
    ...overrides,
  })
}
