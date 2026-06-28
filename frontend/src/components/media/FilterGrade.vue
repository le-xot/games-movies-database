<script setup lang="ts">
import { Star } from '@lucide/vue'
import { computed } from 'vue'
import { gradeTags } from '@/components/media/badge/composables/use-badge-select'
import FilterPopover from '@/components/media/FilterPopover.vue'
import { RecordGrade } from '@/lib/api'

const props = defineProps<{
  value: RecordGrade[] | null
}>()

const emit = defineEmits<{
  update: [value: RecordGrade[] | null]
}>()

const gradeOptions = computed(() =>
  Object.entries(gradeTags).map(([key, value]) => ({
    value: key,
    name: value.name,
    label: value.label,
    class: value.class,
  })),
)
</script>

<template>
  <FilterPopover
    :value="props.value"
    :options="gradeOptions"
    :icon="Star"
    label="Оценка"
    @update="emit('update', $event as RecordGrade[] | null)"
  />
</template>
