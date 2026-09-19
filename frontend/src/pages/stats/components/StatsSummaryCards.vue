<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecordStatus, type StatusCountDTO } from '@/lib/api'

const props = defineProps<{
  total: number
  byStatus: StatusCountDTO[]
}>()

const countFor = (status: RecordStatus) =>
  props.byStatus.find((item) => item.status === status)?.count ?? 0

const cards = computed(() => [
  { title: 'Всего', value: props.total },
  { title: 'Готово', value: countFor(RecordStatus.DONE) },
  { title: 'В процессе', value: countFor(RecordStatus.PROGRESS) },
  { title: 'В очереди', value: countFor(RecordStatus.QUEUE) },
])
</script>

<template>
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <Card v-for="card in cards" :key="card.title" class="bg-[var(--n-action-color)]">
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground">{{ card.title }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold">{{ card.value }}</div>
      </CardContent>
    </Card>
  </div>
</template>
