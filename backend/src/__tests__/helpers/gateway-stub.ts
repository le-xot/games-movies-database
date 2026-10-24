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
    auth: { resolve: async () => null },
    rateLimit: { hit: async () => ({ allowed: true, retryAfterSeconds: 0 }) },
    ...overrides,
  })
}
