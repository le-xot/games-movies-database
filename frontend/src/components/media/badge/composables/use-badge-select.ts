import { acceptHMRUpdate, defineStore } from 'pinia'
import { RecordGrade, RecordStatus } from '@/lib/api'

export interface BadgeOptions {
  name: string
  label?: string
  description?: string
  class?: string
}

export interface BadgeOption<T extends string> {
  label: string
  value: T
  class?: string
}

export function toBadgeOptions<T extends string>(
  tags: Record<T, BadgeOptions>,
  formatLabel: (tag: BadgeOptions) => string = (tag) => tag.name,
): BadgeOption<T>[] {
  return (Object.entries(tags) as [T, BadgeOptions][]).map(([value, tag]) => ({
    label: formatLabel(tag),
    value,
    class: tag.class,
  }))
}

export type SelectKind = 'status' | 'grade'

export const statusTags: Record<RecordStatus, BadgeOptions> = {
  [RecordStatus.QUEUE]: {
    name: 'В очереди',
    description: 'заказ ждёт своего часа.',
    class: 'bg-[#333333]',
  },
  [RecordStatus.UNFINISHED]: {
    name: 'Нет концовки',
    description: 'игра не имеет концовки (титров или логического завершения сюжета).',
    class: 'bg-[#28456c]',
  },
  [RecordStatus.DONE]: {
    name: 'Готово',
    description: 'игра выполнена, кинолента посмотрена.',
    class: 'bg-[#2b593f]',
  },
  [RecordStatus.PROGRESS]: {
    name: 'В процессе',
    description: 'заказ находится на стадии выполнения.',
    class: 'bg-[#89632a]',
  },
  [RecordStatus.DROP]: {
    name: 'Дроп',
    description: 'заказ не будет закончен до конца.',
    class: 'bg-[#6e3630]',
  },
  [RecordStatus.NOTINTERESTED]: {
    name: 'Не интересно',
    description: 'заказ не интересен.',
  },
}

export const gradeTags: Record<RecordGrade, BadgeOptions> = {
  [RecordGrade.RECOMMEND]: {
    name: '🔥',
    label: 'Рекомендую',
    description: 'надеюсь, что это понравится всем. Произведения заслуживающие внимания.',
    class: 'bg-[#28456c] border',
  },
  [RecordGrade.LIKE]: {
    name: '👍',
    label: 'Понравилось',
    description: 'мне, но может не понравится вам. Больше вкусовщина.',
    class: 'bg-[#2b593f] border',
  },
  [RecordGrade.BEER]: {
    name: '🍺',
    label: 'Под пивко',
    description: 'пойдёт. Больше чем на один разочек не тянет, как не старайся.',
    class: 'bg-[#89632a] border',
  },
  [RecordGrade.DISLIKE]: {
    name: '👎',
    label: 'Не рекомендую',
    description: 'и считаю это пустой тратой времени и недостойным проведением досуга.',
    class: 'bg-[#6e3630] border',
  },
}

export const useBadgeSelect = defineStore('use-badge-select', () => {
  const statusOptions = toBadgeOptions(statusTags)
  const gradeOptions = toBadgeOptions(gradeTags, (tag) => `${tag.name} ${tag.label}`)

  return {
    gradeTags,
    statusTags,
    statusOptions,
    gradeOptions,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBadgeSelect, import.meta.hot))
}
