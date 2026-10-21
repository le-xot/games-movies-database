<script setup lang="ts">
import { useDelayedFlag } from '@/composables/use-delayed-flag'
import { apiPendingCount } from '@/stores/use-api'

const active = useDelayedFlag(() => apiPendingCount.value > 0, 200)
</script>

<template>
  <div
    v-if="active"
    class="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
  >
    <div class="app-progress-bar h-full w-1/3 bg-green-500" />
  </div>
</template>

<style scoped>
.app-progress-bar {
  animation: app-progress 1.1s ease-in-out infinite;
}

@keyframes app-progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-progress-bar {
    animation: none;
    width: 100%;
  }
}
</style>
