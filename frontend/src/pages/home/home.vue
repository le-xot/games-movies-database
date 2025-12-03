<script setup lang="ts">
import { ROUTER_PATHS } from '@/lib/router/router-paths'
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const title = useTitle()
onMounted(() => title.value = 'Лешот.ру')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="w-full max-w-4xl">
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink :to="ROUTER_PATHS.home" class="hidden md:block col-span-2 row-span-2 rounded-5xl overflow-hidden">
          <img src="/images/lexot.webp" alt="Лешот" class="object-cover">
        </RouterLink>
        <RouterLink
          :to="ROUTER_PATHS.dbGames" class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-auto"
          style="background-color: #166534CC"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">
              Кладовка
            </h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">
            База данных игр и кинолент
          </p>
        </RouterLink>
        <RouterLink
          :to="ROUTER_PATHS.pc" class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-auto"
          style="background-color: #925f0dCC"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">
              Железяки
            </h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">
            Конфигурация компьютера и периферия
          </p>
        </RouterLink>
        <a
          href="https://steamcommunity.com/id/le_xot" target="_blank"
          class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-auto"
          style="background-color: #000000CC"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">Steam</h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">Архив пиксельных приключений</p>
        </a>
        <a
          href="https://github.com/le-xot" target="_blank"
          class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-auto"
          style="background-color: #181717CC"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">GitHub</h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">Код, который иногда работает</p>
        </a>
        <a
          href="https://t.me/le_xot" target="_blank"
          class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-auto"
          style="background-color: #26A5E4CC"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">Telegram</h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">Быстрый способ достучаться</p>
        </a>
        <a
          href="https://twir.app/s/lexotovo" target="_blank"
          class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-auto"
          style="background-color: #5865F2CC"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">Discord</h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">Деревня "Лешотово"</p>
        </a>
        <a
          href="https://www.twitch.tv/etonelexot" target="_blank"
          class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-auto"
          style="background-color: #9146FFCC"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">Twitch</h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">Стримлю, когда не ленюсь</p>
        </a>
        <a
          href="https://www.youtube.com/@le_xot" target="_blank"
          class="outline rounded-5xl flex flex-col justify-between p-4 text-white h-[20vh] md:h-auto"
          style="background-color: #FF0000CC"
        >
          <div class="flex justify-between">
            <h3 class="text-xl md:text-5xl font-bold">YouTube</h3>
          </div>
          <p class="opacity-90 text-xs md:text-3xl">Канал, прямиком из эпохи летсплеев</p>
        </a>
      </div>
    </div>
  </div>
</template>
