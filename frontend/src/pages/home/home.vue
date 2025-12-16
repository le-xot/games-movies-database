<script setup lang="ts">
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
    <div class="w-full max-w-5xl">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4  ">
        <img
          class="object-cover rounded-xl col-span-1 row-span-2 w-full h-full md:col-span-2"
          src="/images/lexot.webp"
          alt="Main Banner"
        >
        <component
          :is="item.external ? 'a' : RouterLink"
          v-for="item in HOME_GRID_ITEMS"
          :key="item.title"
          :to="!item.external ? item.path : undefined"
          :href="item.external ? item.path : undefined"
          :target="item.external ? '_blank' : undefined"
          class="border-2 rounded-xl border-[#fafafa11] flex flex-col gap-4 p-4 text-white select-none cursor-pointer"
          :style="{ backgroundColor: item.color }"
        >
          <div class="flex items-center gap-2">
            <component
              :is="item.icon"
              size="32"
              class="self-end shrink-0"
            />
            <h3 class="text-3xl font-bold">
              {{ item.title }}
            </h3>
          </div>
          <p class="opacity-90 text-xl font-bold text-gray-100 ">
            {{ item.description }}
          </p>
        </component>
      </div>
    </div>
  </div>
</template>
