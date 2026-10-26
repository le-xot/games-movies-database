/**
 * Каталог косметики профиля: рамки аватара (чекпоинты) и бейджи.
 *
 * Единственный источник правды и для проверок на бэкенде, и для рендера на
 * фронте — расхождение невозможно. В БД лежит только выбранный `id`
 * (`users.avatarFrameId`, `users.activeBadgeId`) и список открытых рамок
 * (`users.unlockedAvatarFrameIds`); вид рисует фронт: неизвестный или
 * устаревший id = «без косметики», без падения.
 *
 * Рамки — не свободная косметика, а чекпоинты: условие достаточно выполнить
 * один раз, после этого рамка открыта навсегда и между открытыми можно
 * переключаться. Пороги условий живут здесь же, чтобы текст требования и
 * проверка на бэкенде не разъехались.
 *
 * Здесь только метаданные: как выглядит рамка, решает фронт
 * (`frontend/src/lib/user-customization.ts`). Никаких зависимостей — файл
 * попадает и в бандл фронта, и в Bun-бэкенд.
 */

export const AVATAR_FRAME_RULES = {
  /** Максимальная серия побед в Wordle. */
  wordleStreak: 30,
  /** Количество поставленных оценок: «больше», то есть строго больше порога. */
  ratings: 100,
} as const

export const AVATAR_FRAMES = [
  {
    id: 'admin',
    title: 'Админ',
    description: 'Красное кольцо',
    requirement: 'Роль администратора',
  },
  {
    id: 'wordle-streak',
    title: 'Серия',
    description: 'Золотое кольцо',
    requirement: `Серия побед в Wordle ${AVATAR_FRAME_RULES.wordleStreak}+`,
  },
  {
    id: 'ratings-100',
    title: 'Сотня',
    description: 'Зелёное кольцо',
    requirement: `Больше ${AVATAR_FRAME_RULES.ratings} оценок`,
  },
] as const

export const USER_BADGES = [
  { id: 'wordle-ace', title: 'Знаток Wordle', description: 'Угадал с первой попытки' },
  { id: 'cinema-buff', title: 'Кинолюб', description: '100 фильмов в базе' },
  { id: 'night-owl', title: 'Полуночник', description: 'Смотрит кино после полуночи' },
] as const

export type AvatarFrameId = (typeof AVATAR_FRAMES)[number]['id']
export type UserBadgeId = (typeof USER_BADGES)[number]['id']

export interface AvatarFrame {
  id: AvatarFrameId
  title: string
  description: string
  /** Как получить рамку — показываем на заблокированной карточке. */
  requirement: string
}

export interface UserBadge {
  id: UserBadgeId
  title: string
  description: string
}

const AVATAR_FRAME_IDS: ReadonlySet<string> = new Set(AVATAR_FRAMES.map((frame) => frame.id))
const USER_BADGE_IDS: ReadonlySet<string> = new Set(USER_BADGES.map((badge) => badge.id))

/** Проверка id на границе API: тип `string` из body ещё ничего не гарантирует. */
export function isAvatarFrameId(value: string): value is AvatarFrameId {
  return AVATAR_FRAME_IDS.has(value)
}

export function isUserBadgeId(value: string): value is UserBadgeId {
  return USER_BADGE_IDS.has(value)
}

export function findAvatarFrame(id: string | null | undefined): AvatarFrame | null {
  if (!id) return null
  return AVATAR_FRAMES.find((frame) => frame.id === id) ?? null
}

export function findUserBadge(id: string | null | undefined): UserBadge | null {
  if (!id) return null
  return USER_BADGES.find((badge) => badge.id === id) ?? null
}
