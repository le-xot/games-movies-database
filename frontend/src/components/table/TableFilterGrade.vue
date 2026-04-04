<script setup lang="ts">
import { computed } from 'vue'
import { RecordGrade } from '@/lib/api'
import { gradeTags } from './composables/use-table-select'
import TableFilterGeneric from './TableFilterGeneric.vue'

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
  <TableFilterGeneric
    :value="props.value"
    :options="gradeOptions"
    @update="emit('update', $event as RecordGrade[] | null)"
  />
</template>
