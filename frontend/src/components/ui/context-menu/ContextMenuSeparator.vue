<script setup lang="ts">
import { cn } from "@/lib/utils"
import { reactiveOmit } from "@vueuse/core"
import {
  ContextMenuSeparator,
} from "reka-ui"
import type { ContextMenuSeparatorProps } from "reka-ui"
import type { HTMLAttributes } from "vue"

const props = defineProps<ContextMenuSeparatorProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <ContextMenuSeparator v-bind="delegatedProps" :class="cn('-mx-1 my-1 h-px bg-border', props.class)" />
</template>
