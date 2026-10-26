/**
 * Каталог косметики профиля: рамки аватара (чекпоинты).
 *
 * Единственный источник правды и для проверок на бэкенде, и для рендера на
 * фронте — расхождение невозможно. В БД лежит только выбранный `id`
 * (`users.avatarFrameId`) и список открытых рамок (`users.unlockedAvatarFrameIds`);
 * вид рисует фронт: неизвестный или устаревший id = «без рамки», без падения.
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
  /** Количество поставленных оценок: порог включительно. */
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
    requirement: `${AVATAR_FRAME_RULES.ratings}+ оценок`,
  },
] as const

export type AvatarFrameId = (typeof AVATAR_FRAMES)[number]['id']

export interface AvatarFrame {
  id: AvatarFrameId
  title: string
  description: string
  /** Как получить рамку — показываем на заблокированной карточке. */
  requirement: string
}

const AVATAR_FRAME_IDS: ReadonlySet<string> = new Set(AVATAR_FRAMES.map((frame) => frame.id))

/** Проверка id на границе API: тип `string` из body ещё ничего не гарантирует. */
export function isAvatarFrameId(value: string): value is AvatarFrameId {
  return AVATAR_FRAME_IDS.has(value)
}

export function findAvatarFrame(id: string | null | undefined): AvatarFrame | null {
  if (!id) return null
  return AVATAR_FRAMES.find((frame) => frame.id === id) ?? null
}
