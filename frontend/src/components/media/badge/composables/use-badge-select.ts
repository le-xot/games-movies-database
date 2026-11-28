import { acceptHMRUpdate, defineStore } from 'pinia'
import {
  GRADE_VOCABULARY,
  STATUS_VOCABULARY,
  type RecordVocabularyEntry,
} from '@/lib/record-vocabulary'

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

function toBadgeTags<T extends string>(
  vocabulary: Record<T, RecordVocabularyEntry>,
): Record<T, BadgeOptions> {
  const entries = Object.entries(vocabulary) as [T, RecordVocabularyEntry][]

  return Object.fromEntries(
    entries.map(([value, entry]) => [
      value,
      {
        name: entry.name,
        label: entry.label,
        description: entry.description,
        class: entry.badgeClass,
      },
    ]),
  ) as Record<T, BadgeOptions>
}

export const statusTags = toBadgeTags(STATUS_VOCABULARY)
export const gradeTags = toBadgeTags(GRADE_VOCABULARY)

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
