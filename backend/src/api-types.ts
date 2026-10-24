/**
 * Имена доменных типов для фронта.
 *
 * Схемы живут в `gateway/*.ts` как TypeBox-модели; здесь — их статические типы
 * под привычными именами (`UserEntity`, `RecordEntity`, …), чтобы фронт не
 * зависел от кодогена. Импортировать нужно только как `import type`.
 */
export type { GatewayUser as UserEntity } from '@backend/gateway/auth'
export type {
  GatewayRecord as RecordEntity,
  GatewayOwnership as SuggestionOwnershipEntity,
  RecordsPage as GetAllRecordsDTO,
} from '@backend/gateway/records'
export type { Like, LikesPage as GetLikesByIdDTO } from '@backend/gateway/likes'
export type {
  Friends,
  RatedRecord as UserRatedRecordEntity,
  Rating,
  RatingsPage as GetUserRatingsEntity,
} from '@backend/gateway/ratings'
export type { Queue, QueueItem } from '@backend/gateway/queue'
export type {
  GenreCountDTO,
  GenreGradeCountDTO,
  GenreStatusCountDTO,
  GradeCountDTO,
  RecordsStats,
  StatusCountDTO,
} from '@backend/gateway/stats'
export type {
  MergeResult as MergeUsersResultEntity,
  UserAccount as UserAccountEntity,
} from '@backend/gateway/users'
export type { WeatherResponse } from '@backend/gateway/weather'
export type {
  WordleLeaderboard as WordleLeaderboardDTO,
  WordleLeaderboard,
  WordlePracticeState as WordlePracticeStateDTO,
  WordlePracticeState,
  WordleState as WordleStateDTO,
  WordleState,
  WordleStats as WordleStatsDTO,
  WordleStats,
  WordleNotificationLink,
  WordleNotificationStatus as WordleNotificationsStatusDTO,
  WordleNotificationStatus,
} from '@backend/gateway/wordle'
export type { SteamGame as SteamGameDto } from '@backend/gateway/steam'
export type { FriendMember as FriendsMemberEntity } from '@backend/gateway/ratings'
export type {
  RecordCreateInput as RecordCreateFromLinkDTO,
  RecordUpdateInput as RecordUpdateDTO,
  RecordUpdatePosterInput as RecordUpdatePosterDTO,
} from '@backend/gateway/records'
export type { RatingUpsertInput as RatingUpsertDTO } from '@backend/gateway/ratings'
export type { MergeInput as MergeUsersDto } from '@backend/gateway/users'
export type { CreateSuggestionInput as UserSuggestionDTO } from '@backend/gateway/suggestions'
export type { WordleNotificationInput as WordleNotificationsUpdateDTO } from '@backend/gateway/wordle'

// Производные типы: удобные имена для вложенных структур, которые фронт
// использовал из сгенерированного контракта.
import type { RecordsStats } from '@backend/gateway/stats'
import type { WordleLeaderboard, WordleState, WordleStats } from '@backend/gateway/wordle'

export type RecordsStatsDTO = RecordsStats
export type WordleHistoryDayDTO = WordleStats['history'][number]
export type WordleGuessStateDTO = WordleState['guesses'][number]
export type WordleLeaderboardEntryDTO = WordleLeaderboard['entries'][number]
export type WordleDailyLeaderboardEntryDTO = WordleLeaderboard['today']['entries'][number]
