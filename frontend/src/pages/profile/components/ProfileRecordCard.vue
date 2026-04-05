<script setup lang="ts">
import { gradeTags } from '@/components/table/composables/use-table-select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RecordEntity, RecordGrade } from '@/lib/api'
import { formatDate } from '@/utils/date'
import { getImageUrl } from '@/utils/image'

defineProps<{ record: RecordEntity }>()

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/images/aga.webp'
}
</script>

<template>
  <Card class="bg-[var(--n-action-color)] min-h-[200px] flex flex-col">
    <div class="flex flex-1 h-full">
      <div
        v-if="record.posterUrl"
        class="relative w-[150px] flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]"
      >
        <img
          :src="getImageUrl(record.posterUrl)"
          class="w-full h-full object-cover rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] aspect-[2/3]"
          alt=""
          @error="handleImageError"
        />
      </div>
      <div
        v-else
        class="relative w-[150px] flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] flex items-center justify-center aspect-[2/3]"
      >
        <span class="text-white text-xs text-center px-2">{{ record.title?.slice(0, 20) }}...</span>
      </div>
      <div class="flex flex-col flex-1 justify-between overflow-hidden">
        <CardHeader>
          <CardTitle class="text-xl overflow-hidden line-clamp-2 max-w-full box-border" :title="record.title">
            {{ record.title }}
          </CardTitle>
        </CardHeader>
        <CardContent
          v-if="record.link"
          class="text-xs text-[#1e90ff] underline italic block whitespace-nowrap overflow-hidden text-ellipsis"
        >
          <a :href="record.link" target="_blank">
            {{ record.link }}
          </a>
        </CardContent>
        <CardFooter class="flex flex-col items-start w-full">
          <div class="flex justify-between w-full items-center">
            <div v-if="record.createdAt" class="text-sm text-muted-foreground">
              {{ formatDate(record.createdAt) }}
            </div>
            <Badge
              v-if="record.grade"
              :class="gradeTags[record.grade as RecordGrade]?.class"
              class="text-white pointer-events-none h-8 min-w-28 justify-center select-none"
            >
              {{ gradeTags[record.grade as RecordGrade]?.name }}
              {{ gradeTags[record.grade as RecordGrade]?.label }}
            </Badge>
          </div>
        </CardFooter>
      </div>
    </div>
  </Card>
</template>
