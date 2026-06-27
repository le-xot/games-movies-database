<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { DialogTitle, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import type { DialogTitleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DialogTitle
    v-bind="forwardedProps"
    :class="cn('text-lg font-semibold text-foreground', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
