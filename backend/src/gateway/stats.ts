import { apiErrorModels, publicErrors } from '@backend/gateway/errors'
import { recordEnumModels } from '@backend/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

const {
  RecordGenre: recordGenreSchema,
  RecordGrade: recordGradeSchema,
  RecordStatus: recordStatusSchema,
} = recordEnumModels

export const genreCountSchema = t.Object({
  genre: recordGenreSchema,
  count: t.Number(),
})

export const statusCountSchema = t.Object({
  status: recordStatusSchema,
  count: t.Number(),
})

export const gradeCountSchema = t.Object({
  grade: recordGradeSchema,
  count: t.Number(),
})

export const genreStatusCountSchema = t.Object({
  genre: recordGenreSchema,
  status: recordStatusSchema,
  count: t.Number(),
})

export const genreGradeCountSchema = t.Object({
  genre: recordGenreSchema,
  grade: recordGradeSchema,
  count: t.Number(),
})

export const RecordsStatsDTO = t.Object({
  total: t.Number(),
  byGenre: t.Array(genreCountSchema),
  byStatus: t.Array(statusCountSchema),
  byGrade: t.Array(gradeCountSchema),
  byFriendsGrade: t.Array(gradeCountSchema),
  byGenreStatus: t.Array(genreStatusCountSchema),
  byGenreGrade: t.Array(genreGradeCountSchema),
  byFriendsGenreGrade: t.Array(genreGradeCountSchema),
})

export const statsModels = {
  GenreCountDTO: genreCountSchema,
  StatusCountDTO: statusCountSchema,
  GradeCountDTO: gradeCountSchema,
  GenreStatusCountDTO: genreStatusCountSchema,
  GenreGradeCountDTO: genreGradeCountSchema,
  RecordsStatsDTO,
}

export type GenreCountDTO = typeof genreCountSchema.static
export type StatusCountDTO = typeof statusCountSchema.static
export type GradeCountDTO = typeof gradeCountSchema.static
export type GenreStatusCountDTO = typeof genreStatusCountSchema.static
export type GenreGradeCountDTO = typeof genreGradeCountSchema.static
export type RecordsStats = typeof RecordsStatsDTO.static

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
          ...publicErrors(),
        },
      },
    )
}
