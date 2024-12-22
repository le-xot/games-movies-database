<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { TableCell } from '@/components/ui/table'
import { toRef } from 'vue'
import { useTableCol } from '../composables/use-table-col'

type TitleType = string | undefined

const props = defineProps<{ title: TitleType }>()
const emits = defineEmits<{ update: [TitleType] }>()
const title = toRef(props, 'title')

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
      class="h-8 text-left"
      @blur="handleChange"
      @keydown.enter="handleChange"
    />
    <template v-else>
      {{ inputValue }}
    </template>
  </TableCell>
</template>
