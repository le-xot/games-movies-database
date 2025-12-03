<script lang="ts" setup>
import { BentoGrid, BentoGridCard } from '@/components/ui/bento-grid'
import { BENTO_ITEMS } from '@/pages/home/constants/links.ts'
import { useTitle } from '@vueuse/core'

useTitle('Лешот.ру')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="max-w-5xl w-full">
      <BentoGrid class="grid-cols-4 auto-rows-[140px] gap-4">
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
            <!-- Фон с фото только для аватара -->
            <template v-if="item.background === 'image'" #background>
              <img
                src="/images/lexot.webp"
                alt="Лешот"
                class="absolute inset-0 w-full h-full object-cover none"
              >
            </template>

            <!-- Цветной полупрозрачный фон для остальных -->
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
