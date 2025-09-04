<script setup lang="ts">
import Toaster from '@/components/ui/toast/Toaster.vue'
import { useWebSocket } from '@/composables/use-websocket.ts'
import { onMounted, ref } from 'vue'

const maintenanceMode = ref(false)

onMounted(() => {
  const bypassMaintenance = localStorage.getItem('bypassMaintenance')
  if (bypassMaintenance === 'true') {
    maintenanceMode.value = false
  }
})

useWebSocket()
</script>

// ----- Секрет -----

// localStorage.setItem('bypassMaintenance', 'true')

// ----- Секрет -----

<template>
  <Toaster />
  <div v-if="maintenanceMode" class="w-full h-screen flex items-center justify-center bg-zinc-900 text-white font-['Comfortaa',_sans-serif]">
    <div class="text-center p-8 max-w-[700px]">
      <h1 class="text-4xl mb-4">
        Технические работы на сайте
      </h1>
      <p class="text-xl opacity-80">
        ЛешотРу временно недоступен. Пожалуйста, зайдите позже.
      </p>
      <p class="mt-10 text-xl opacity-80 text-sky-500 underline">
        <a href="https://t.me/lexotdev" target="_blank">
          https://t.me/lexotdev
        </a>
      </p>
    </div>
  </div>
  <RouterView v-else />
</template>
