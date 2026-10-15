<script setup lang="ts">
import { CommandPalette } from '@/components/palette'
import { useWebSocket } from '@/composables/use-websocket'

useWebSocket()
</script>

<template>
  <div class="h-screen flex flex-col">
    <RouterView />
    <CommandPalette />
  </div>
</template>
