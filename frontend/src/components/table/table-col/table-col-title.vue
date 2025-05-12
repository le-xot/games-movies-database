<script setup lang="ts">
import { useBreakpoints } from '@/composables/use-breakpoints'
import { toRef } from 'vue'
import { useTableCol } from '../composables/use-table-col'

type TitleType = string | undefined

const props = defineProps<{ title: TitleType }>()
const emits = defineEmits<{ update: [TitleType] }>()
const title = toRef(props, 'title')

const breakpoints = useBreakpoints()

const {
  inputValue,
} = useTableCol<TitleType>(title, emits)
</script>

<template>
  <span :class="{ 'pl-2': breakpoints.isDesktop }">
    {{ inputValue }}
  </span>
</template>
