<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <thead :class="cn('table-header [&_tr]:border-b', props.class)">
    <slot />
  </thead>
</template>

<style scoped>
.table-header {
  position: sticky;
  inset-block-start: 0px;
  background: hsla(var(--secondary));
}
</style>
