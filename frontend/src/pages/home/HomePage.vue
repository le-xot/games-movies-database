<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import TimeBadge from '@/pages/home/components/TimeBadge.vue'
import WeatherBadge from '@/pages/home/components/WeatherBadge.vue'
import { HOME_GRID_ITEMS } from '@/pages/home/constants/home-items'

const title = useTitle()
const weatherExpanded = ref(false)
const heroLoaded = ref(false)

onMounted(() => {
  title.value = 'Сайт Лешота'
})
</script>

<template>
  <div class="min-h-screen flex items-start justify-center p-8 md:items-center">
    <div class="w-full max-w-5xl">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="relative col-span-1 md:col-span-2 md:row-span-2">
          <!-- Заглушка на время загрузки баннера: без неё видно alt и пустую ячейку. -->
          <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900" />
          <img
            data-hero
            class="relative w-full aspect-square rounded-xl object-contain transition-opacity duration-300 ease-out md:aspect-auto md:h-full md:object-cover"
            :class="heroLoaded ? 'opacity-100' : 'opacity-0'"
            src="/images/lexot.webp"
            width="666"
            height="666"
            alt=""
            @load="heroLoaded = true"
            @error="heroLoaded = true"
          />
          <TimeBadge v-show="!weatherExpanded" />
          <WeatherBadge @expand="weatherExpanded = true" @collapse="weatherExpanded = false" />
        </div>
        <component
          :is="item.external ? 'a' : RouterLink"
          v-for="item in HOME_GRID_ITEMS"
          :key="item.title"
          v-bind="item.external ? { href: item.path, target: '_blank' } : { to: item.path }"
          class="border-2 rounded-xl border-[#fafafa33] flex flex-col gap-4 p-4 text-white select-none cursor-pointer"
          :style="{ backgroundColor: item.color }"
        >
          <div class="flex items-center gap-2">
            <component :is="item.icon" size="32" class="self-end shrink-0" />
            <h3 class="text-3xl font-bold">
              {{ item.title }}
            </h3>
          </div>
          <p class="opacity-90 text-xl font-bold text-gray-100">
            {{ item.description }}
          </p>
        </component>
      </div>
    </div>
  </div>
</template>
