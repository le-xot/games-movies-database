<script setup lang="ts" generic="T extends StatusesEnum | GradeEnum | GenresEnum">
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { TableCell } from '@/components/ui/table'
import { Tag } from '@/components/ui/tag'
import { GenresEnum, GradeEnum, StatusesEnum } from '@/lib/api.ts'
import { computed, ref, toRef } from 'vue'
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

const {
  isEdit,
  handleOpen,
  handleClose,
  handleUpdateValue,
} = useTableCol<T>(selectValue, emits)

const select = useTableSelect()
const data = computed(() => {
  const tag = select[`${props.kind}Tags`]?.[selectValue.value] as BadgeOptions
  return {
    tag: tag ?? null,
    options: select.options[props.kind],
  }
})

const placeholder = computed(() => {
  if (!data.value.tag) return 'Отсутствует'
  return data.value.tag.name
})
</script>

<template>
  <TableCell
    @click="() => {
      handleOpen()
      isOpen = true
    }"
  >
    <Select
      v-if="isEdit || data.tag"
      v-model:open="isOpen"
      @update:model-value="(value) => {
        handleUpdateValue(value)
        handleClose()
      }"
    >
      <SelectTrigger
        :class="data.tag?.class"
        as-child
        @blur="handleClose"
      >
        <span>
          {{ placeholder }}
        </span>
      </SelectTrigger>
      <SelectContent class="w-[180px]">
        <SelectItem
          v-for="option in data.options"
          :key="option.value"
          :value="option.value"
          hide-indicator
        >
          <Tag class="w-full" :class="option.class">
            {{ option.label }}
          </Tag>
        </SelectItem>
      </SelectContent>
    </Select>
    <Tag v-else-if="!data.tag" class="border border-input w-full">
      Отсутствует
    </Tag>
  </TableCell>
</template>
