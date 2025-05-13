<script setup lang="ts">
import { useBreakpoints } from '@/composables/use-breakpoints'
import { computed, toRef } from 'vue'
import { useTableCol } from '../composables/use-table-col'

type TitleType = string | undefined

const props = defineProps<{ title: TitleType }>()
const emits = defineEmits<{ update: [TitleType] }>()
const title = toRef(props, 'title')

const breakpoints = useBreakpoints()

const {
  inputValue,
} = useTableCol<TitleType>(title, emits)

const truncatedValue = computed(() => {
  if (!inputValue.value) return inputValue.value

  const maxLength = 65
  return inputValue.value.length > maxLength
    ? `${inputValue.value.slice(0, maxLength)}...`
    : inputValue.value
})
</script>

<template>
  <span
    :class="{ 'pl-2': breakpoints.isDesktop }"
    :title="inputValue"
    class="block truncate"
  >
    {{ truncatedValue }}
  </span>
</template>
