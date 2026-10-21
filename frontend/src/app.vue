<script setup lang="ts">
import AppProgressBar from '@/components/layout/AppProgressBar.vue'
import { CommandPalette } from '@/components/palette'
import { useWebSocket } from '@/composables/use-websocket'

useWebSocket()
</script>

<template>
  <div class="h-screen flex flex-col">
    <AppProgressBar />
    <RouterView />
    <CommandPalette />
  </div>
</template>
