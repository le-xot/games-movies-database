<script setup lang="ts" generic="T extends RecordStatus | RecordGrade | RecordGenre">
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Tag } from '@/components/ui/tag'
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
        handleUpdateValue(value)
        handleClose()
      }"
    >
      <SelectTrigger
        class="min-w-32"
        :class="[data.tag?.class]"
        as-child
        :disabled="!isAdmin"
        @blur="handleClose"
      >
        <span>
          {{ placeholder }}
        </span>
      </SelectTrigger>
      <SelectContent align="center" class="w-full">
        <SelectItem
          v-for="option in data.options"
          :key="option.value"
          :value="option.value"
          hide-indicator
        >
          <Tag class="p-6 w-full" :class="option.class">
            {{ option.label }}
          </Tag>
        </SelectItem>
      </SelectContent>
    </Select>
    <Tag v-else-if="!data.tag" class="w-full border border-input">
      {{ placeholder }}
    </Tag>
  </div>
</template>
