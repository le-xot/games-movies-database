<script setup lang="ts">
import { AvatarRoot } from 'reka-ui'
import { cn } from '@/lib/utils'
import { avatarVariant } from '.'
import type { AvatarVariants } from '.'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    size?: AvatarVariants['size']
    shape?: AvatarVariants['shape']
  }>(),
  {
    size: 'sm',
    shape: 'circle',
  },
)
</script>

<template>
  <AvatarRoot :class="cn(avatarVariant({ size, shape }), props.class)">
    <slot />
  </AvatarRoot>
</template>
