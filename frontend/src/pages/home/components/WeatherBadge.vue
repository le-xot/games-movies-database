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
  emit(expanded.value ? 'expand' : 'collapse')
}
</script>

<template>
  <div
    v-if="!loading && city && temp !== null"
    class="absolute top-3 left-3 text-white"
    :class="
      expanded
        ? 'right-3 bottom-3 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/60 backdrop-blur-md'
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
      <component :is="icon" :size="48" class="shrink-0" />
      <span class="text-xl font-semibold">{{ city }}</span>
      <span class="text-4xl font-bold">{{ temp }}°C</span>
      <span class="text-lg opacity-90 capitalize">{{ description }}</span>
      <div class="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-base opacity-90">
        <div class="flex items-center gap-2">
          <Thermometer :size="18" class="shrink-0" />
          <span>Ощущается {{ feelsLike }}°C</span>
        </div>
        <div class="flex items-center gap-2">
          <Droplets :size="18" class="shrink-0" />
          <span>Влажность {{ humidity }}%</span>
        </div>
        <div class="flex items-center gap-2">
          <Wind :size="18" class="shrink-0" />
          <span>Ветер {{ windSpeed }} м/с</span>
        </div>
        <div class="flex items-center gap-2">
          <Gauge :size="18" class="shrink-0" />
          <span>Давление {{ pressure }} мм</span>
        </div>
        <div class="flex items-center gap-2">
          <Eye :size="18" class="shrink-0" />
          <span>Видимость {{ visibility }} км</span>
        </div>
        <div class="flex items-center gap-2">
          <Cloud :size="18" class="shrink-0" />
          <span>Облачность {{ clouds }}%</span>
        </div>
        <div class="flex items-center gap-2">
          <Sunrise :size="18" class="shrink-0" />
          <span>Восход {{ sunrise }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Sunset :size="18" class="shrink-0" />
          <span>Закат {{ sunset }}</span>
        </div>
      </div>
    </template>
    <template v-else>
      <component :is="icon" :size="20" class="shrink-0" />
      <span>{{ city }} {{ temp }}°C</span>
    </template>
  </div>
</template>
