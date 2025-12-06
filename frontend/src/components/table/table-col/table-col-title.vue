<script setup lang="ts">
import { useBreakpoints } from "@/composables/use-breakpoints"
import { generateWatchLink } from "@/lib/utils/generate-watch-link"
import { computed, toRef } from "vue"
import { useTableCol } from "../composables/use-table-col"

type TitleType = string | undefined

const props = defineProps<{ title: TitleType, link: string }>()
const emits = defineEmits<{ update: [TitleType] }>()
const title = toRef(props, "title")

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

const watchLink = computed(() => {
  return generateWatchLink(props.link) || props.link
})
</script>

<template>
  <a
    :class="{ 'pl-2': breakpoints.isDesktop }"
    :title="inputValue"
    class="block truncate"
    :href="watchLink"
    target="_blank"
  >
    {{ truncatedValue }}
  </a>
</template>
