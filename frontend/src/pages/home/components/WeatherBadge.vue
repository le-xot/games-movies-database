<script setup lang="ts">
import { useWeather } from '@/pages/home/composables/use-weather'

const { city, temp, icon, loading } = useWeather()
</script>

<template>
  <div
    v-if="!loading && city && temp !== null"
    class="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm"
  >
    <component :is="icon" :size="20" class="shrink-0" />
    <span>{{ city }} {{ temp }}°C</span>
  </div>
</template>
