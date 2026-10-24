import { createGateway, type GatewayDeps } from '@/gateway'

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
    auth: { resolve: async () => null },
    rateLimit: { hit: async () => ({ allowed: true, retryAfterSeconds: 0 }) },
    ...overrides,
  })
}
