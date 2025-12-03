<template>
  <div
    :key="name"
    :class="
      cn(
        'group relative col-span-3 flex flex-col justify-end overflow-hidden rounded-xl',
        // light styles
        'bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        // dark styles
        'transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]',
        props.class,
      )
    "
  >
    <slot name="background" />

    <div
      class="mt-6 pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 justify-between h-full"
    >
      <div class="flex items-center gap-3">
        <component
          :is="icon"
          v-if="icon"
          class="w-12 h-12 mr-2 origin-left transform-gpu text-foreground transition-all duration-300 ease-in-out"
        />
        <h3 class="text-5xl font-semibold text-foreground">
          {{ name }}
        </h3>
      </div>
      <p v-if="description" class="text-3xl max-w-lg mb-6  text-white">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { Component } from 'vue'

interface Props {
  name: string
  class?: string
  icon?: Component
  description?: string
  href: string
}

const props = defineProps<Props>()
</script>
