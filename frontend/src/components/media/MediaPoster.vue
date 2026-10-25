<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { getImageUrl, isImageReady } from '@/utils/image'

const props = defineProps<{
  url?: string | null
  label?: string
}>()

const isLoaded = ref(false)
/**
 * Постер уже был в кэше браузера. Такой не нужно проявлять: фейд из серой заглушки
 * на каждом ремоунте карточки (переход между категориями, скролл виртуализированной
 * сетки) выглядит как мигание.
 */
const skipFade = ref(false)
const image = ref<HTMLImageElement | null>(null)

/**
 * Уже загруженный постер ждать не нужно: браузер держит его в кэше и умеет отдать
 * в первом же кадре, не дожидаясь события `load`.
 */
function revealIfCached() {
  if (!isImageReady(image.value)) return
  skipFade.value = true
  isLoaded.value = true
}

watch(
  () => props.url,
  async () => {
    isLoaded.value = false
    skipFade.value = false
    await nextTick()
    revealIfCached()
  },
)

onMounted(revealIfCached)

function handleImageLoad() {
  isLoaded.value = true
}

function handleImageError(event: Event) {
  isLoaded.value = true
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
      ref="image"
      :src="getImageUrl(url)"
      class="w-full h-full object-cover"
      :class="[
        skipFade ? '' : 'transition-opacity duration-300 ease-out',
        isLoaded ? 'opacity-100' : 'opacity-0',
      ]"
      alt=""
      @load="handleImageLoad"
      @error="handleImageError"
    />
    <div v-else class="absolute inset-0 flex items-center justify-center p-2">
      <span class="text-white text-center font-bold opacity-40">{{ label }}</span>
    </div>
    <slot />
  </div>
</template>
