import { Elysia, t } from 'elysia'
import { apiErrorModels, standardErrors } from '@/gateway/errors'
import { recordEnumModels } from '@/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@/gateway/rate-limit'
import { RATE_LIMITS } from '@/utils/rate-limits'

export const statsModels = {
  GenreCountDTO: t.Object({
    genre: t.Ref('RecordGenre'),
    count: t.Number(),
  }),
  StatusCountDTO: t.Object({
    status: t.Ref('RecordStatus'),
    count: t.Number(),
  }),
  GradeCountDTO: t.Object({
    grade: t.Ref('RecordGrade'),
    count: t.Number(),
  }),
  GenreStatusCountDTO: t.Object({
    genre: t.Ref('RecordGenre'),
    status: t.Ref('RecordStatus'),
    count: t.Number(),
  }),
  GenreGradeCountDTO: t.Object({
    genre: t.Ref('RecordGenre'),
    grade: t.Ref('RecordGrade'),
    count: t.Number(),
  }),
  RecordsStatsDTO: t.Object({
    total: t.Number(),
    byGenre: t.Array(t.Ref('GenreCountDTO')),
    byStatus: t.Array(t.Ref('StatusCountDTO')),
    byGrade: t.Array(t.Ref('GradeCountDTO')),
    byFriendsGrade: t.Array(t.Ref('GradeCountDTO')),
    byGenreStatus: t.Array(t.Ref('GenreStatusCountDTO')),
    byGenreGrade: t.Array(t.Ref('GenreGradeCountDTO')),
    byFriendsGenreGrade: t.Array(t.Ref('GenreGradeCountDTO')),
  }),
}

export type RecordsStats = typeof statsModels.RecordsStatsDTO.static

export interface StatsReader {
  getRecordsStats(): Promise<RecordsStats>
}

export interface StatsRouteDeps {
  stats: StatsReader
  rateLimit: RateLimiter
}

export function statsRoutes({ stats, rateLimit }: StatsRouteDeps) {
  return new Elysia({ name: 'stats' })
    .model({ ...apiErrorModels, ...recordEnumModels, ...statsModels })
    .get(
      '/stats/records',
      async ({ request, server }) => {
        await enforceRateLimit(rateLimit, {
          request,
          route: 'StatsController.getRecordsStats',
          config: RATE_LIMITS.public,
          ip: server?.requestIP(request)?.address,
        })

        return await stats.getRecordsStats()
      },
      {
        response: {
          200: 'RecordsStatsDTO' as const,
          ...standardErrors({ auth: false }),
        },
      },
    )
}
