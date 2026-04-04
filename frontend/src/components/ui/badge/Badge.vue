<script setup lang="ts">
import { badgeVariants } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BadgeVariants } from '@/components/ui/badge'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  variant?: BadgeVariants['variant']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
