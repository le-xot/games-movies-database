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
  align-items: flex-start;
  justify-content: center;
}

@media (min-width: 768px) {
  .home-layout {
    align-items: center;
    /* Если контент выше экрана (страница «Железяки»), центрирование не должно
       утаскивать его верх за границу вьюпорта. */
    align-items: safe center;
  }
}
</style>
