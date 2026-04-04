<script setup lang="ts">
import { TooltipTrigger } from 'reka-ui'
import type { TooltipTriggerProps } from 'reka-ui'

const props = defineProps<TooltipTriggerProps>()
</script>

<template>
  <TooltipTrigger v-bind="props">
    <slot />
  </TooltipTrigger>
</template>
