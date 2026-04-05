<script setup lang="ts">
import { ContextMenuSub, useForwardPropsEmits } from 'reka-ui'
import type { ContextMenuSubEmits, ContextMenuSubProps } from 'reka-ui'

const props = defineProps<ContextMenuSubProps>()
const emits = defineEmits<ContextMenuSubEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <ContextMenuSub v-bind="forwarded">
    <slot />
  </ContextMenuSub>
</template>
