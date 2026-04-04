<script setup lang="ts">
import { TooltipRoot, useForwardPropsEmits } from 'reka-ui'
import type { TooltipRootEmits, TooltipRootProps } from 'reka-ui'

const props = defineProps<TooltipRootProps>()
const emits = defineEmits<TooltipRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <TooltipRoot v-bind="forwarded">
    <slot />
  </TooltipRoot>
</template>
