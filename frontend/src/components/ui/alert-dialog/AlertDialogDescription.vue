<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogDescription } from 'reka-ui'
import { cn } from '@/lib/utils'
import type { AlertDialogDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AlertDialogDescription
    v-bind="delegatedProps"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
