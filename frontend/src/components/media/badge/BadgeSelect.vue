<script setup lang="ts" generic="T extends RecordStatus | RecordGrade | RecordGenre">
import BadgePopover from '@/components/media/badge/BadgePopover.vue'
import { SelectKind } from '@/components/media/badge/composables/use-badge-select'
import { RecordGenre, RecordGrade, RecordStatus } from '@/lib/api'

type ValueSelect = T | undefined

const props = defineProps<{
  kind: SelectKind
  value: ValueSelect
  compact?: boolean
}>()
const emits = defineEmits<{ update: [ValueSelect] }>()
</script>

<template>
  <BadgePopover
    :kind="props.kind"
    :value="props.value"
    :compact="props.compact"
    @update="(value) => emits('update', value)"
  />
</template>
