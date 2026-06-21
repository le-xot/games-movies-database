<script setup lang="ts">
import { useWeather } from '@/pages/home/composables/use-weather'

const { city, temp, icon, loading } = useWeather()
</script>

<template>
  <div
    v-if="!loading && city && temp !== null"
    class="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm"
  >
    <component :is="icon" :size="16" class="shrink-0" />
    <span>{{ city }} {{ temp }}°C</span>
  </div>
</template>
