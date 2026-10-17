<script setup lang="ts">
import { ref, watch } from 'vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WordleGame from '@/pages/wordle/components/WordleGame.vue'
import WordlePractice from '@/pages/wordle/components/WordlePractice.vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'
import type { WordleMode } from '@/pages/wordle/composables/use-wordle'

const wordle = useWordle()
const mode = ref<WordleMode>('daily')

watch(mode, (value) => wordle.setMode(value), { immediate: true })
</script>

<template>
  <div class="flex flex-col">
    <Tabs v-model="mode" class="mx-auto mb-2">
      <TabsList>
        <TabsTrigger value="daily">Слово дня</TabsTrigger>
        <TabsTrigger value="practice">Тренировка</TabsTrigger>
      </TabsList>
    </Tabs>

    <WordleGame v-if="mode === 'daily'" />
    <WordlePractice v-else />
  </div>
</template>
