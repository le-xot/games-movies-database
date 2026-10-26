import { findAvatarFrame, findUserBadge } from '@gmdb/contract'
import { Film, Moon, Trophy } from '@lucide/vue'
import type { AvatarFrameId, UserBadgeId } from '@gmdb/contract'
import type { Component } from 'vue'

/**
 * Каталог косметики → то, что реально рисует фронт.
 *
 * Идентификаторы и тексты живут в `@gmdb/contract` (их же валидирует бэкенд), а
 * вид — здесь: рамка это CSS-кольцо, бейдж — иконка. Неизвестный или устаревший
 * id (каталог почистили, в БД остался старый) даёт `null`: рендерим как обычного
 * пользователя, без падений.
 */

export interface ResolvedFrame {
  id: AvatarFrameId
  title: string
  description: string
  /** Как открыть рамку — показываем на заблокированной карточке. */
  requirement: string
  /** Цвет кольца: обёртка аватара с отступом. */
  ringClassName: string
}

export interface ResolvedBadge {
  id: UserBadgeId
  title: string
  description: string
  icon: Component
}

/** Рамка — просто цвет, без градиентов и свечения. */
const FRAME_STYLES: Record<AvatarFrameId, string> = {
  admin: 'bg-red-500',
  'wordle-streak': 'bg-amber-400',
  'ratings-100': 'bg-emerald-500',
}

const BADGE_ICONS: Record<UserBadgeId, Component> = {
  'wordle-ace': Trophy,
  'cinema-buff': Film,
  'night-owl': Moon,
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

export function resolveBadge(id: string | null | undefined): ResolvedBadge | null {
  const badge = findUserBadge(id)
  if (!badge) return null

  return {
    id: badge.id,
    title: badge.title,
    description: badge.description,
    icon: BADGE_ICONS[badge.id],
  }
}
