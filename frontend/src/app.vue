<script setup lang="ts">
import { useWebSocket } from '@/composables/use-websocket'

useWebSocket()
</script>

<template>
  <div class="h-screen flex flex-col">
    <RouterView />
  </div>
</template>
