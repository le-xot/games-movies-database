<script lang="ts" setup>
import { BentoGrid, BentoGridCard } from '@/components/ui/bento-grid'
import { BENTO_ITEMS } from '@/pages/home/constants/links.ts'
import { useTitle } from '@vueuse/core'

useTitle('Лешот.ру')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 sm:p-6">
    <div class="max-w-5xl w-full">
      <BentoGrid class="grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[100px] sm:auto-rows-[140px] gap-2 sm:gap-4">
        <a
          v-for="(item, index) in BENTO_ITEMS"
          :key="index"
          :href="item.href"
          :class="item.class"
          class="block"
          :style="{ pointerEvents: item.background === 'image' ? 'none' : 'auto' }"
        >
          <BentoGridCard
            :name="item.background === 'image' ? '' : item.name"
            :description="item.background === 'image' ? '' : item.description"
            :icon="item.background === 'image' ? undefined : item.icon"
            :href="item.href"
            class="overflow-hidden relative h-full cursor-pointer text-white [&_svg]:text-white"
          >
            <template v-if="item.background === 'image'" #background>
              <img
                src="/images/lexot.webp"
                alt="Лешот"
                class="absolute inset-0 w-full h-full object-cover"
              >
            </template>
            <template v-else #background>
              <div
                class="absolute inset-0 opacity-70"
                :style="{ backgroundColor: item.bgColor }"
              />
            </template>
          </BentoGridCard>
        </a>
      </BentoGrid>
    </div>
  </div>
</template>
