<script setup lang="ts">
import { ref } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { provideScrollContainer } from '@/composables/use-scroll-container'

const bodyRef = ref<HTMLElement | null>(null)

provideScrollContainer(bodyRef)
</script>

<template>
  <div ref="bodyRef" class="body">
    <div class="body-content">
      <Toaster />
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scrollbar-width: auto;
  scrollbar-color: oklch(0.4 0 0) transparent;
}

.body-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}
</style>
