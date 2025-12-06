<script setup lang="ts">
import { Input } from "@/components/ui/input"
import { useBreakpoints } from "@/composables/use-breakpoints"
import { computed, toRef } from "vue"
import { useTableCol } from "../composables/use-table-col"

type EpisodeType = string | undefined

const props = defineProps<{ episode: EpisodeType }>()
const emits = defineEmits<{ update: [EpisodeType] }>()
const episode = toRef(props, "episode")

const breakpoints = useBreakpoints()

const {
  isEdit,
  inputValue,
  handleChange,
  handleOpen,
  inputRef,
} = useTableCol<EpisodeType>(episode, emits)

const formattedEpisode = computed(() => {
  if (!inputValue.value) return []

  return inputValue.value.split("").map(char => ({
    char,
    isLetter: /[a-zA-Z\u0410-\u044F\u0401\u0451]/.test(char),
  }))
})
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
      <span
        v-for="(item, index) in formattedEpisode"
        :key="index"
        :class="item.isLetter ? 'text-gray-400' : 'text-white'"
      >
        {{ item.char }}
      </span>
    </span>
  </div>
</template>
