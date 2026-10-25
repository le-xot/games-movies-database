import type { GatewayDeps } from '@backend/gateway'
import type { LikeService } from '@backend/modules/like/like.service'
import type { RatingService } from '@backend/modules/rating/rating.service'
import type { RecordService } from '@backend/modules/record/record.service'
import type { SuggestionService } from '@backend/modules/suggestion/suggestion.service'

export interface CatalogServices {
  records: RecordService
  ratings: RatingService
  likes: LikeService
  suggestions: SuggestionService
}

/**
 * Порты «каталога»: записи, оценки, лайки, предложения.
 *
 * Гейтвей описывает, что ему нужно, домен это уже реализует — здесь остаётся
 * только привести форму запроса (query → аргументы сервиса). Данные идут как
 * есть: сущности уже отдают ISO-строки для дат, конвертировать нечего.
 */
export function catalogPorts({
  records,
  ratings,
  likes,
  suggestions,
}: CatalogServices): Pick<GatewayDeps, 'records' | 'ratings' | 'likes' | 'suggestions'> {
  return {
    records: {
      createFromLink: (data) =>
        records.createRecordFromLink({
          link: data.link,
          ...(data.status ? { status: data.status } : {}),
          ...(data.type ? { type: data.type } : {}),
        }),
      findById: (id, viewerId) => records.findRecordById(id, viewerId),
      patch: (id, data) =>
        records.patchRecord(id, {
          ...(data.status ? { status: data.status } : {}),
          ...(data.grade !== undefined ? { grade: data.grade } : {}),
          ...(data.episode !== undefined ? { episode: data.episode } : {}),
          ...(data.type ? { type: data.type } : {}),
        }),
      updatePoster: (id, url) => records.updatePoster(id, url),
      remove: (id) => records.deleteRecord(id),
      getAll: async (query) => {
        const { page, limit, orderBy, direction, viewerId, ...rest } = query
        const filters = {
          ...(rest.search !== undefined ? { search: rest.search } : {}),
          ...(rest.status !== undefined ? { status: rest.status } : {}),
          ...(rest.type !== undefined ? { type: rest.type } : {}),
          ...(rest.grade !== undefined ? { grade: rest.grade } : {}),
          ...(rest.genre !== undefined ? { genre: rest.genre } : {}),
        }

        const result = await records.getAllRecords(
          page,
          limit,
          filters,
          orderBy,
          direction,
          viewerId,
        )

        return { records: result.records, total: result.total }
      },
    },
    ratings: {
      rate: (userId, recordId, grade) => ratings.rate(userId, recordId, grade),
      unrate: (userId, recordId) => ratings.unrate(userId, recordId),
      getMy: async (userId, query) => {
        const { items, total } = await ratings.getUserRatings(
          userId,
          userId,
          query.page,
          query.limit,
          query.grade,
        )

        return { items, total }
      },
      getUser: async (viewerId, userId, query) => {
        const { items, total } = await ratings.getUserRatings(
          viewerId,
          userId,
          query.page,
          query.limit,
          query.grade,
        )

        return { items, total }
      },
      getFriends: async () => ({ members: await ratings.getFriends() }),
    },
    likes: {
      createLike: (userId, recordId) => likes.createLike(userId, recordId),
      deleteLike: (userId, recordId) => likes.deleteLike(userId, recordId),
      getLikesByRecordId: async (recordId) => {
        const page = await likes.getLikesByRecordId(recordId)

        return { likes: page.likes, total: page.total }
      },
      getLikesByUserId: async (userId) => {
        const page = await likes.getLikesByUserId(userId)

        return { likes: page.likes, total: page.total }
      },
      getLikes: async (page, limit) => {
        const result = await likes.getLikes(page, limit)

        return { likes: result.likes, total: result.total }
      },
    },
    suggestions: {
      list: () => suggestions.getSuggestions(),
      create: (input) => suggestions.userSuggest(input),
      remove: (id, userId) => suggestions.deleteUserSuggestion(id, userId),
    },
  }
}
