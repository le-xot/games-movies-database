<script setup lang="ts">
import { AvatarRoot } from 'reka-ui'
import { avatarVariant } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { AvatarVariants } from '@/components/ui/avatar'
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
