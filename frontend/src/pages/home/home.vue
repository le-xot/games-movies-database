<script setup lang="ts">
import { HOME_GRID_ITEMS } from '@/pages/home/constants/home-items.ts'
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { TelegramIcon } from 'vue3-simple-icons'

const title = useTitle()

onMounted(() => {
  title.value = 'Лешот.ру'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="w-full max-w-4xl">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3  ">
        <img
          class="object-cover rounded-xl col-span-2 row-span-2 w-full"
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
          class="border-2 rounded-xl border-[#fafafa11] flex flex-col gap-4 p-4 text-white transition-transform hover:scale-[1.02] select-none cursor-pointer"
          :style="{ backgroundColor: item.color }"
        >
          <TelegramIcon size="48" class="" />
          <h3 class="text-3xl font-bold">
            {{ item.title }}
          </h3>
          <p class="opacity-90 text-xl text-gray-300 ">
            {{ item.description }}
          </p>
        </component>
      </div>
    </div>
  </div>
</template>

<style>
:root{
  --main-grid-cols: repeat(3, minmax(0, 1fr));
}
</style>
