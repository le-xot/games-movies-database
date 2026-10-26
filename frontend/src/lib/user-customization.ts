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
  /** Градиент кольца: обёртка аватара с отступом. */
  ringClassName: string
  /** Внешнее свечение под кольцом. */
  glowClassName: string
}

export interface ResolvedBadge {
  id: UserBadgeId
  title: string
  description: string
  icon: Component
}

interface FrameStyle {
  ring: string
  glow: string
}

const FRAME_STYLES: Record<AvatarFrameId, FrameStyle> = {
  admin: {
    ring: 'bg-[conic-gradient(from_210deg,#f87171,#b91c1c,#f87171,#991b1b,#f87171)]',
    glow: 'shadow-[0_0_12px_rgba(248,113,113,0.5)]',
  },
  'wordle-streak': {
    ring: 'bg-[conic-gradient(from_140deg,#f8e08e,#c98a2b,#f8e08e,#b9721f,#f8e08e)]',
    glow: 'shadow-[0_0_12px_rgba(248,224,142,0.45)]',
  },
  'ratings-100': {
    ring: 'bg-[conic-gradient(from_20deg,#86efac,#15803d,#86efac,#166534,#86efac)]',
    glow: 'shadow-[0_0_12px_rgba(134,239,172,0.45)]',
  },
}

const BADGE_ICONS: Record<UserBadgeId, Component> = {
  'wordle-ace': Trophy,
  'cinema-buff': Film,
  'night-owl': Moon,
}

export function resolveFrame(id: string | null | undefined): ResolvedFrame | null {
  const frame = findAvatarFrame(id)
  if (!frame) return null

  const style = FRAME_STYLES[frame.id]
  return {
    id: frame.id,
    title: frame.title,
    description: frame.description,
    requirement: frame.requirement,
    ringClassName: style.ring,
    glowClassName: style.glow,
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
