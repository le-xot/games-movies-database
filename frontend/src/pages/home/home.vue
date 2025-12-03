<script setup lang="ts">
import { ROUTER_PATHS } from '@/lib/router/router-paths'
import { HOME_GRID_ITEMS } from '@/pages/home/constants/home-items.ts'
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const title = useTitle()

onMounted(() => {
  title.value = 'Лешот.ру'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="w-full max-w-4xl">
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink
          :to="ROUTER_PATHS.home"
          class="hidden md:block col-span-2 row-span-2 rounded-5xl overflow-hidden select-none"
        >
          <img
            class="w-full h-[calc(40vh+1rem)] object-cover"
            src="/images/lexot.webp"
            alt="Main Banner"
          >
        </RouterLink>
        <component
          :is="item.external ? 'a' : RouterLink"
          v-for="item in HOME_GRID_ITEMS"
          :key="item.title"
          :to="!item.external ? item.path : undefined"
          :href="item.external ? item.path : undefined"
          :target="item.external ? '_blank' : undefined"
          class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-[20vh] transition-transform hover:scale-[1.05] select-none"
          :style="{ backgroundColor: item.color }"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">
              {{ item.title }}
            </h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">
            {{ item.description }}
          </p>
        </component>
      </div>
    </div>
  </div>
</template>
