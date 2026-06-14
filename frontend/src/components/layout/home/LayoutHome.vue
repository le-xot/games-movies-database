<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div class="home-layout">
    <Toaster />
    <RouterView />
  </div>
</template>

<style scoped>
.home-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
