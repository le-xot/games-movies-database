/**
 * Каталог косметики профиля: рамки аватара и бейджи.
 *
 * Единственный источник правды и для валидации на бэкенде, и для рендера на
 * фронте — расхождение физически невозможно. В БД лежит только выбранный `id`
 * (`users.avatarFrameId`, `users.activeBadgeId`), сам вид рисует фронт:
 * неизвестный или устаревший id = «без косметики», без падения.
 *
 * Здесь только метаданные: как выглядит рамка, решает фронт
 * (`frontend/src/lib/user-customization.ts`). Никаких зависимостей — файл
 * попадает и в бандл фронта, и в Bun-бэкенд.
 */

export const AVATAR_FRAMES = [
  { id: 'gold', title: 'Золотая', description: 'Тёплая обводка' },
  { id: 'neon', title: 'Неон', description: 'Светящийся контур' },
  { id: 'frost', title: 'Иней', description: 'Холодный голубой градиент' },
  { id: 'ember', title: 'Угли', description: 'Оранжевое свечение' },
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
