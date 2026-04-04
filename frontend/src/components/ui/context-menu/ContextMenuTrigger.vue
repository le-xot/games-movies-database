<script setup lang="ts">
import { ContextMenuTrigger, useForwardProps } from 'reka-ui'
import type { ContextMenuTriggerProps } from 'reka-ui'

const props = defineProps<ContextMenuTriggerProps>()

const forwardedProps = useForwardProps(props)
</script>

<template>
  <ContextMenuTrigger v-bind="forwardedProps">
    <slot />
  </ContextMenuTrigger>
</template>
