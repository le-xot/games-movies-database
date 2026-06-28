<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div class="body">
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
