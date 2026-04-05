<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div class="body">
    <Toaster />
    <RouterView />
  </div>
</template>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  scrollbar-width: none;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
}
</style>
