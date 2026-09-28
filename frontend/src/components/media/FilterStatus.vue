<script setup lang="ts">
import { SlidersHorizontal } from '@lucide/vue'
import { computed } from 'vue'
import { statusTags, toBadgeOptions } from '@/components/media/badge/composables/use-badge-select'
import FilterPopover from '@/components/media/FilterPopover.vue'
import { RecordStatus } from '@/lib/api'

const props = defineProps<{
  value: RecordStatus[] | null
}>()

const emit = defineEmits<{
  update: [value: RecordStatus[] | null]
}>()

const statusOptions = computed(() =>
  toBadgeOptions(statusTags).map(({ value, label, class: optionClass }) => ({
    value,
    name: label,
    class: optionClass,
  })),
)
</script>

<template>
  <FilterPopover
    :value="props.value"
    :options="statusOptions"
    :icon="SlidersHorizontal"
    label="Статус"
    @update="emit('update', $event)"
  />
</template>
