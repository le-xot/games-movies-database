import { UserRole } from '@backend/enums'
import { AVATAR_FRAMES, AVATAR_FRAME_RULES, isAvatarFrameId } from '@gmdb/contract'
import type { AvatarFrameId } from '@gmdb/contract'

/**
 * Рамки-чекпоинты: условие достаточно выполнить один раз, после этого рамка
 * остаётся открытой навсегда (`users.unlockedAvatarFrameIds` — только union,
 * ничего не отзываем). Здесь чистая логика: что заработано прямо сейчас.
 */
export interface CustomizationStats {
  role: UserRole
  ratingsCount: number
  maxWordleStreak: number
}

export function earnedAvatarFrames({ role, ratingsCount, maxWordleStreak }: CustomizationStats) {
  const earned: AvatarFrameId[] = []

  if (role === UserRole.ADMIN) earned.push('admin')
  if (maxWordleStreak >= AVATAR_FRAME_RULES.wordleStreak) earned.push('wordle-streak')
  if (ratingsCount > AVATAR_FRAME_RULES.ratings) earned.push('ratings-100')

  return earned
}

/**
 * Объединяет уже открытое с заработанным. Мусор из старых версий каталога
 * отбрасывается, порядок — как в каталоге, чтобы ответ был стабильным.
 */
export function mergeUnlockedFrames(
  current: readonly string[],
  earned: readonly AvatarFrameId[],
): AvatarFrameId[] {
  const unlocked = new Set<string>([...current, ...earned])

  return AVATAR_FRAMES.filter((frame) => isAvatarFrameId(frame.id) && unlocked.has(frame.id)).map(
    (frame) => frame.id,
  )
}
