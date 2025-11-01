<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { useBreakpoints } from '@/composables/use-breakpoints'
import { toRef } from 'vue'
import { useTableCol } from '../composables/use-table-col'

export type EpisodeType = string | undefined

const props = defineProps<{ episode: EpisodeType }>()
const emits = defineEmits<{ update: [EpisodeType] }>()
const episode = toRef(props, 'episode')

const breakpoints = useBreakpoints()

const {
  isEdit,
  inputValue,
  handleChange,
  handleOpen,
  inputRef,
} = useTableCol<EpisodeType>(episode, emits)
</script>

<template>
  <div @click="handleOpen">
    <Input
      v-if="isEdit"
      ref="inputRef"
      v-model="inputValue"
      class="h-8 text-left w-full"
      @blur="handleChange"
      @keydown.enter="handleChange"
    />
    <span v-else :class="{ 'pl-2': breakpoints.isDesktop }">
      {{ inputValue || '' }}
    </span>
  </div>
</template>
