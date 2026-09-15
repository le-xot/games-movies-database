<script setup lang="ts">
import { getImageUrl } from '@/utils/image'

defineProps<{
  url?: string | null
  label?: string
}>()

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.dataset.fallback) {
    img.style.display = 'none'
    return
  }
  img.dataset.fallback = '1'
  img.src = '/images/aga.webp'
}
</script>

<template>
  <div class="relative flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 overflow-hidden">
    <img
      v-if="url"
      :src="getImageUrl(url)"
      class="w-full h-full object-cover"
      alt=""
      @error="handleImageError"
    />
    <div v-else class="absolute inset-0 flex items-center justify-center p-2">
      <span class="text-white text-center font-bold opacity-40">{{ label }}</span>
    </div>
    <slot />
  </div>
</template>
