<script setup lang="ts" generic="T extends RecordStatus | RecordGrade | RecordGenre">
import { SelectKind } from '@/components/table/composables/use-table-select'
import TableColPopover from '@/components/table/table-col/TableColPopover.vue'
import { RecordGenre, RecordGrade, RecordStatus } from '@/lib/api'

type ValueSelect = T | undefined

const props = defineProps<{
  kind: SelectKind
  value: ValueSelect
}>()
const emits = defineEmits<{ update: [ValueSelect] }>()
</script>

<template>
  <TableColPopover
    :kind="props.kind"
    :value="props.value"
    @update="(value) => emits('update', value)"
  />
</template>
