<script setup lang="ts">
import { Cloud, Droplets, Eye, Gauge, Sunrise, Sunset, Thermometer, Wind, X } from '@lucide/vue'
import { ref } from 'vue'
import { useWeather } from '@/pages/home/composables/use-weather'

const {
  city,
  temp,
  description,
  feelsLike,
  humidity,
  windSpeed,
  pressure,
  visibility,
  clouds,
  sunrise,
  sunset,
  icon,
  loading,
} = useWeather()

const emit = defineEmits<{
  expand: []
  collapse: []
}>()

const expanded = ref(false)

function toggle() {
  expanded.value = !expanded.value
  if (expanded.value) {
    emit('expand')
  } else {
    emit('collapse')
  }
}
</script>

<template>
  <div
    v-if="!loading && city && temp !== null"
    class="absolute top-3 left-3 text-white"
    :class="
      expanded
        ? 'right-3 bottom-3 z-10 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-md'
        : 'flex cursor-pointer items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-base font-semibold backdrop-blur-sm transition-colors hover:bg-black/60'
    "
    @click="!expanded && toggle()"
  >
    <template v-if="expanded">
      <button
        class="absolute top-3 right-3 cursor-pointer text-white/80 hover:text-white"
        @click.stop="toggle()"
      >
        <X :size="24" />
      </button>
      <component :is="icon" :size="40" class="hidden shrink-0 md:block" />
      <span class="text-base font-semibold md:text-xl">{{ city }}</span>
      <span class="text-2xl font-bold md:text-4xl">{{ temp }}°C</span>
      <span class="text-sm capitalize opacity-90 md:text-lg">{{ description }}</span>
      <div class="mt-2 grid grid-cols-2 gap-2 px-2 text-base md:mt-3 md:gap-x-6 md:gap-y-2">
        <div class="flex items-center gap-2">
          <Thermometer :size="18" class="shrink-0" />
          <span class="md:hidden">{{ feelsLike }}°C</span>
          <span class="hidden md:inline">Ощущается {{ feelsLike }}°C</span>
        </div>
        <div class="flex items-center gap-2">
          <Droplets :size="18" class="shrink-0" />
          <span class="md:hidden">{{ humidity }}%</span>
          <span class="hidden md:inline">Влажность {{ humidity }}%</span>
        </div>
        <div class="flex items-center gap-2">
          <Wind :size="18" class="shrink-0" />
          <span class="md:hidden">{{ windSpeed }} м/с</span>
          <span class="hidden md:inline">Ветер {{ windSpeed }} м/с</span>
        </div>
        <div class="flex items-center gap-2">
          <Gauge :size="18" class="shrink-0" />
          <span class="md:hidden">{{ pressure }} мм</span>
          <span class="hidden md:inline">Давление {{ pressure }} мм</span>
        </div>
        <div class="flex items-center gap-2">
          <Eye :size="18" class="shrink-0" />
          <span class="md:hidden">{{ visibility }} км</span>
          <span class="hidden md:inline">Видимость {{ visibility }} км</span>
        </div>
        <div class="flex items-center gap-2">
          <Cloud :size="18" class="shrink-0" />
          <span class="md:hidden">{{ clouds }}%</span>
          <span class="hidden md:inline">Облачность {{ clouds }}%</span>
        </div>
        <div class="flex items-center gap-2">
          <Sunrise :size="18" class="shrink-0" />
          <span class="md:hidden">{{ sunrise }}</span>
          <span class="hidden md:inline">Восход {{ sunrise }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Sunset :size="18" class="shrink-0" />
          <span class="md:hidden">{{ sunset }}</span>
          <span class="hidden md:inline">Закат {{ sunset }}</span>
        </div>
      </div>
    </template>
    <template v-else>
      <component :is="icon" :size="20" class="shrink-0" />
      <span>{{ city }} {{ temp }}°C</span>
    </template>
  </div>
</template>
