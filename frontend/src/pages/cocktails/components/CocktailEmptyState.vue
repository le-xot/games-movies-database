<script setup lang="ts">
import { Martini } from '@lucide/vue'
import type { Component } from 'vue'

defineProps<{
  title: string
  description?: string
  icon?: Component
}>()
</script>

<template>
  <div
    class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 px-6 py-12 text-center"
  >
    <component :is="icon ?? Martini" class="size-8 text-muted-foreground" />
    <p class="text-base font-medium">{{ title }}</p>
    <p v-if="description" class="max-w-sm text-sm text-muted-foreground">{{ description }}</p>
    <slot />
  </div>
</template>
