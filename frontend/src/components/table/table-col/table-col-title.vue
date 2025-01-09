<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { TableCell } from '@/components/ui/table'
import { useBreakpoints } from '@/composables/use-breakpoints'
import { toRef } from 'vue'
import { useTableCol } from '../composables/use-table-col'

type TitleType = string | undefined

const props = defineProps<{ title: TitleType }>()
const emits = defineEmits<{ update: [TitleType] }>()
const title = toRef(props, 'title')

const breakpoints = useBreakpoints()

const {
  isEdit,
  inputValue,
  handleChange,
  handleOpen,
  inputRef,
} = useTableCol<TitleType>(title, emits)
</script>

<template>
  <TableCell @click="handleOpen">
    <Input
      v-if="isEdit"
      ref="inputRef"
      v-model="inputValue"
      class="h-8 text-left w-full"
      @blur="handleChange"
      @keydown.enter="handleChange"
    />
    <span v-else :class="{ 'pl-2': breakpoints.isDesktop }">
      {{ inputValue || 'Нет данных' }}
    </span>
  </TableCell>
</template>
