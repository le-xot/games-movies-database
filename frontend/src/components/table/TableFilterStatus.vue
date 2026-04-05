<script setup lang="ts">
import { computed } from 'vue'
import { statusTags } from '@/components/table/composables/use-table-select'
import TableFilterGeneric from '@/components/table/TableFilterGeneric.vue'
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
  <TableFilterGeneric
    :value="props.value"
    :options="statusOptions"
    @update="emit('update', $event as RecordStatus[] | null)"
  />
</template>
