<script setup lang="ts" generic="T extends StatusesEnum | GradeEnum | GenresEnum">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableCell } from '@/components/ui/table'
import { Tag } from '@/components/ui/tag'
import { GenresEnum, GradeEnum, StatusesEnum } from '@/lib/api.ts'
import { computed, toRef } from 'vue'
import { useTableCol } from '../composables/use-table-col'
import { BadgeOptions, SelectKind, useTableSelect } from '../composables/use-table-select'

type ValueSelect = T | undefined

const props = defineProps<{
  kind: SelectKind
  value: ValueSelect
}>()
const emits = defineEmits<{ update: [ValueSelect] }>()
const selectValue = toRef(props, 'value')

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
  if (!data.value.tag) return 'Выберите значение'
  return `${data.value.tag.name} ${data.value.tag.label ?? ''}`
})
</script>

<template>
  <TableCell @click="handleOpen">
    <Select
      v-if="isEdit"
      default-open
      @update:model-value="(value) => {
        handleUpdateValue(value)
        handleClose()
      }"
    >
      <SelectTrigger class="w-[180px]" @blur="handleClose">
        <SelectValue :placeholder="placeholder" />
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
    <Tag v-else-if="data.tag" :class="data.tag.class">
      {{ data.tag.name }}
    </Tag>
  </TableCell>
</template>
