<script setup lang="ts">
import { RecordStatus } from '@/lib/api'
import { computed } from 'vue'
import TableFilterGeneric from './table-filter-generic.vue'
import { statusTags } from './composables/use-table-select'

const props = defineProps<{
  value: RecordStatus[] | null
}>()

const emit = defineEmits<{
  update: [value: RecordStatus[] | null]
}>()

const statusOptions = computed(() => Object.entries(statusTags).map(([key, value]) => ({
  value: key,
  name: value.name,
  class: value.class,
})))
</script>

<template>
  <TableFilterGeneric
    :value="props.value"
    :options="statusOptions"
    @update="emit('update', $event as RecordStatus[] | null)"
  />
</template>
