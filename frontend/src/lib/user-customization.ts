import { findAvatarFrame } from '@gmdb/contract'
import type { AvatarFrameId } from '@gmdb/contract'

/**
 * Каталог рамок → то, что реально рисует фронт.
 *
 * Идентификаторы и тексты живут в `@gmdb/contract` (их же валидирует бэкенд), а
 * вид — здесь: рамка это CSS-кольцо. Неизвестный или устаревший id (каталог
 * почистили, в БД остался старый) даёт `null`: рендерим как обычного
 * пользователя, без падений.
 */

export interface ResolvedFrame {
  id: AvatarFrameId
  title: string
  description: string
  /** Как открыть рамку — показываем на заблокированной карточке. */
  requirement: string
  /** Цвет кольца: рамка-бордер на обёртке аватара. */
  ringClassName: string
}

/**
 * Рамка — просто цвет, без градиентов и свечения.
 *
 * Рисуем бордером, а не подложкой с отступом: дробные отступы на мелких
 * размерах дают неравномерное кольцо из-за округления пикселей.
 */
const FRAME_STYLES: Record<AvatarFrameId, string> = {
  admin: 'border-red-500',
  'wordle-streak': 'border-amber-400',
  'ratings-100': 'border-emerald-500',
}

export function resolveFrame(id: string | null | undefined): ResolvedFrame | null {
  const frame = findAvatarFrame(id)
  if (!frame) return null

  return {
    id: frame.id,
    title: frame.title,
    description: frame.description,
    requirement: frame.requirement,
    ringClassName: FRAME_STYLES[frame.id],
  }
}
