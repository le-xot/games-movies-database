<script setup lang="ts" generic="T extends RecordStatus | RecordGrade | RecordGenre">
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useUser } from '@/composables/use-user'
import { RecordGenre, RecordGrade, RecordStatus } from '@/lib/api.ts'
import { storeToRefs } from 'pinia'
import { computed, ref, toRef, useId } from 'vue'
import { useTableCol } from '../composables/use-table-col'
import { BadgeOptions, SelectKind, useTableSelect } from '../composables/use-table-select'

type ValueSelect = T | undefined

const props = defineProps<{
  kind: SelectKind
  value: ValueSelect
}>()
const emits = defineEmits<{ update: [ValueSelect] }>()
const selectValue = toRef(props, 'value')

const isOpen = ref(false)
const { isAdmin } = storeToRefs(useUser())

const {
  isEdit,
  handleOpen,
  handleClose,
  handleUpdateValue,
} = useTableCol<T>(selectValue, emits)

const id = useId()
const select = useTableSelect()
const data = computed(() => {
  const tag = select[`${props.kind}Tags`]?.[selectValue.value] as BadgeOptions
  return {
    tag: tag ?? null,
    options: select.options[props.kind],
  }
})

const placeholder = computed(() => {
  if (!data.value.tag) return 'Нет данных'
  return data.value.tag.name
})
</script>

<template>
  <div
    @click="() => {
      if (!isAdmin) return
      handleOpen()
      isOpen = true
    }"
  >
    <Select
      v-if="isEdit || data.tag"
      v-model:open="isOpen"
      :name="`${props.kind}-${id}`"
      @update:model-value="(value) => {
        handleUpdateValue(value as string)
        handleClose()
      }"
    >
      <SelectTrigger
        class="w-full cursor-default relative h-8 flex items-center justify-center text-xs font-semibold !text-white/80 opacity-100 min-w-28 select-none"
        :class="data.tag?.class"
        as-child
        :disabled="!isAdmin"
        @blur="handleClose"
      >
        <span class="w-full absolute inset-0 flex items-center justify-center !text-white/80">
          {{ placeholder }}
        </span>
      </SelectTrigger>
      <SelectContent align="center" class="w-full">
        <SelectItem
          v-for="option in data.options"
          :key="option.value"
          :value="option.value"
          hide-indicator
          class="h-8 flex items-center rounded-md justify-center font-medium text-xs border hover:opacity-80 focus:opacity-90"
          :class="option.class"
        >
          <span>
            {{ option.label }}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
    <div
      v-else-if="!data.tag"
      class="w-full cursor-default relative h-8 flex items-center justify-center text-xs font-semibold border border-input rounded-md min-w-28 select-none"
    >
      <span class="w-full absolute inset-0 flex items-center justify-center">
        {{ placeholder }}
      </span>
    </div>
  </div>
</template>
