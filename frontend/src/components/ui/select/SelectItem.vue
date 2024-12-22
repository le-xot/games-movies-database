<script setup lang="ts">
import { cn } from '@/lib/utils'
import { CheckIcon } from '@radix-icons/vue'
import {
  SelectItem,
  SelectItemIndicator,
  type SelectItemProps,
  SelectItemText,
  useForwardProps,
} from 'radix-vue'
import { computed, type HTMLAttributes } from 'vue'

interface _SelectItemProps extends SelectItemProps {
  hideIndicator?: boolean
}

const props = defineProps<_SelectItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 p-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
        {
          'p-2': !props.hideIndicator,
          'pr-8': !props.hideIndicator,
        },
      )
    "
  >
    <span
      v-if="!props.hideIndicator"
      class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center"
    >
      <SelectItemIndicator>
        <CheckIcon class="h-4 w-4" />
      </SelectItemIndicator>
    </span>

    <SelectItemText class="w-full">
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
