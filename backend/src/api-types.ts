/**
 * Имена доменных типов для фронта.
 *
 * Схемы живут в `gateway/*.ts` как TypeBox-модели; здесь — их статические типы
 * под привычными именами (`UserEntity`, `RecordEntity`, …), чтобы фронт не
 * зависел от кодогена. Импортировать нужно только как `import type`.
 *
 * Список минимальный: только имена, которые фронт реально импортирует из
 * `@/lib/api`. Новый алиас добавляется вместе с потребителем.
 */
export type { GatewayUser as UserEntity } from '@backend/gateway/auth'
export type { GatewayRecord as RecordEntity } from '@backend/gateway/records'
export type { GenreCountDTO, StatusCountDTO } from '@backend/gateway/stats'
export type {
  MergeResult as MergeUsersResultEntity,
  UserAccount as UserAccountEntity,
} from '@backend/gateway/users'
export type { SteamGame as SteamGameDto } from '@backend/gateway/steam'
export type { FriendMember as FriendsMemberEntity } from '@backend/gateway/ratings'
export type { RecordUpdateInput as RecordUpdateDTO } from '@backend/gateway/records'
export type {
  WordleLeaderboard as WordleLeaderboardDTO,
  WordlePracticeState as WordlePracticeStateDTO,
  WordleNotificationStatus,
  WordleState as WordleStateDTO,
  WordleStats as WordleStatsDTO,
} from '@backend/gateway/wordle'

// Производные типы: удобные имена для вложенных структур, которые фронт
// использовал из сгенерированного контракта.
import type { RecordsStats } from '@backend/gateway/stats'
import type { WordleLeaderboard, WordleState, WordleStats } from '@backend/gateway/wordle'

export type RecordsStatsDTO = RecordsStats
export type WordleHistoryDayDTO = WordleStats['history'][number]
export type WordleGuessStateDTO = WordleState['guesses'][number]
export type WordleLeaderboardEntryDTO = WordleLeaderboard['entries'][number]
export type WordleDailyLeaderboardEntryDTO = WordleLeaderboard['today']['entries'][number]
