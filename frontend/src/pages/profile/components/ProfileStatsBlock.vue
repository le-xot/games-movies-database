<script setup lang="ts">
import { genreTags, gradeTags } from '@/components/table/composables/use-table-select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ProfileStatsEntity, RecordGenre, RecordGrade } from '@/lib/api'

defineProps<{
  stats: ProfileStatsEntity
}>()
</script>

<template>
  <Card class="p-6">
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-muted-foreground">Всего записей</span>
        <span class="text-3xl font-bold">{{ stats.totalRecords }}</span>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-muted-foreground">Получено лайков</span>
        <span class="text-3xl font-bold">{{ stats.totalLikesReceived }}</span>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-muted-foreground">По категориям</span>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="item in stats.recordsByGenre" :key="item.genre" variant="secondary">
            {{ genreTags[item.genre as RecordGenre]?.name || item.genre }}: {{ item.count }}
          </Badge>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-muted-foreground">Оценки</span>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="item in stats.gradeDistribution" :key="item.grade" variant="outline">
            {{ gradeTags[item.grade as RecordGrade]?.name || item.grade }} {{ item.count }}
          </Badge>
        </div>
      </div>
    </div>
  </Card>
</template>
