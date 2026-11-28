<script setup lang="ts">
import { Card } from '@/components/ui/card'

/**
 * Скелетон карточки записи для первичной загрузки и «догрузки». Одна разметка
 * вместо двух копий в `DataCards`.
 */
withDefaults(defineProps<{ withBadges?: boolean }>(), { withBadges: false })
</script>

<template>
  <Card>
    <div class="flex flex-row sm:flex-col">
      <div
        class="w-[130px] sm:w-full flex-shrink-0 aspect-[2/3] bg-zinc-700 animate-pulse rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] sm:rounded-bl-none sm:rounded-t-[calc(var(--radius)+4px)]"
      />
      <div class="flex flex-col gap-2 p-3 flex-1 min-w-0">
        <div class="h-4 w-3/4 bg-zinc-700 rounded animate-pulse" />
        <div class="h-3 w-1/2 bg-zinc-700 rounded animate-pulse" />
        <div v-if="withBadges" class="flex gap-2 mt-1">
          <div class="h-6 w-10 bg-zinc-700 rounded animate-pulse" />
          <div class="h-6 w-10 bg-zinc-700 rounded animate-pulse" />
          <div class="h-6 w-10 bg-zinc-700 rounded animate-pulse" />
          <div class="h-6 w-10 bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </Card>
</template>
