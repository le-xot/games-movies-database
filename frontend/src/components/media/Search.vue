<script setup lang="ts">
import { XIcon } from '@lucide/vue'
import { computed } from 'vue'
import FilterGrade from '@/components/media/FilterGrade.vue'
import FilterStatus from '@/components/media/FilterStatus.vue'
import { Input } from '@/components/ui/input'
import { RecordGrade, RecordStatus } from '@/lib/api'

const searchValue = defineModel<string>('value', { required: true })

const props = defineProps<{
  statusesFilter?: RecordStatus[] | null
  gradeFilter?: RecordGrade[] | null
}>()

const emit = defineEmits<{
  'update:statusesFilter': [value: RecordStatus[] | null]
  'update:gradeFilter': [value: RecordGrade[] | null]
}>()

const placeholder = computed(() => 'Искать по названию')

function clearSearch() {
  searchValue.value = ''
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div class="relative flex-1 min-w-0">
      <Input v-model:model-value="searchValue" class="pr-10" :placeholder="placeholder" />
      <span
        class="absolute cursor-pointer end-0 inset-y-0 flex items-center justify-center px-2"
        @click="clearSearch"
      >
        <XIcon class="size-4 text-muted-foreground" />
      </span>
    </div>

    <template v-if="props.statusesFilter !== undefined">
      <FilterStatus
        :value="props.statusesFilter ?? null"
        @update="emit('update:statusesFilter', $event)"
      />
      <FilterGrade
        :value="props.gradeFilter ?? null"
        @update="emit('update:gradeFilter', $event)"
      />
    </template>
  </div>
</template>
