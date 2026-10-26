import { AVATAR_FRAMES, USER_BADGES, findAvatarFrame, findUserBadge } from '@gmdb/contract'
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
  gold: {
    ring: 'bg-[conic-gradient(from_140deg,#f8e08e,#c98a2b,#f8e08e,#b9721f,#f8e08e)]',
    glow: 'shadow-[0_0_10px_rgba(248,224,142,0.45)]',
  },
  neon: {
    ring: 'bg-[conic-gradient(from_90deg,#22d3ee,#a855f7,#22d3ee)]',
    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.55)]',
  },
  frost: {
    ring: 'bg-[conic-gradient(from_220deg,#bae6fd,#e0f2fe,#7dd3fc,#bae6fd)]',
    glow: 'shadow-[0_0_10px_rgba(125,211,252,0.5)]',
  },
  ember: {
    ring: 'bg-[conic-gradient(from_200deg,#fb923c,#ef4444,#fbbf24,#fb923c)]',
    glow: 'shadow-[0_0_12px_rgba(251,146,60,0.5)]',
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

/** Варианты для выбора в аккаунт-диалоге — в порядке каталога. */
export const FRAME_OPTIONS: readonly string[] = AVATAR_FRAMES.map((frame) => frame.id)
export const BADGE_OPTIONS: readonly string[] = USER_BADGES.map((badge) => badge.id)
