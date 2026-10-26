<script setup lang="ts">
import { computed } from 'vue'
import { resolveBadge } from '@/lib/user-customization'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'vue'

/**
 * Косметический бейдж рядом с ником. Неизвестный/отсутствующий id = ничего не
 * рендерим: каталог может почиститься, а в БД остаться старое значение.
 */
const props = withDefaults(
  defineProps<{
    badgeId?: string | null
    class?: HTMLAttributes['class']
  }>(),
  { badgeId: null, class: undefined },
)

const badge = computed(() => resolveBadge(props.badgeId))
</script>

<template>
  <span
    v-if="badge"
    :title="`${badge.title} — ${badge.description}`"
    :aria-label="badge.title"
    role="img"
    :class="
      cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 p-0.5 text-muted-foreground',
        props.class,
      )
    "
  >
    <component :is="badge.icon" class="size-4" aria-hidden="true" />
  </span>
</template>
