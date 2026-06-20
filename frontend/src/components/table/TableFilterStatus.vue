<script setup lang="ts">
import { computed } from 'vue'
import { statusTags } from '@/components/table/composables/use-table-select'
import TableFilterPopover from '@/components/table/TableFilterPopover.vue'
import { RecordStatus } from '@/lib/api'

const props = defineProps<{
  value: RecordStatus[] | null
}>()

const emit = defineEmits<{
  update: [value: RecordStatus[] | null]
}>()

const statusOptions = computed(() =>
  Object.entries(statusTags).map(([key, value]) => ({
    value: key,
    name: value.name,
    class: value.class,
  })),
)
</script>

<template>
  <TableFilterPopover
    :value="props.value"
    :options="statusOptions"
    @update="emit('update', $event as RecordStatus[] | null)"
  />
</template>
