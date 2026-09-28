<script setup lang="ts">
import { Star } from '@lucide/vue'
import { computed } from 'vue'
import { gradeTags, toBadgeOptions } from '@/components/media/badge/composables/use-badge-select'
import FilterPopover from '@/components/media/FilterPopover.vue'
import { RecordGrade } from '@/lib/api'

const props = defineProps<{
  value: RecordGrade[] | null
}>()

const emit = defineEmits<{
  update: [value: RecordGrade[] | null]
}>()

const gradeOptions = computed(() =>
  toBadgeOptions(gradeTags, (tag) => tag.name).map(({ value, label, class: optionClass }) => ({
    value,
    name: label,
    label: gradeTags[value].label,
    class: optionClass,
  })),
)
</script>

<template>
  <FilterPopover
    :value="props.value"
    :options="gradeOptions"
    :icon="Star"
    label="Оценка"
    @update="emit('update', $event)"
  />
</template>
