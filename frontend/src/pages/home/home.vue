<script setup lang="ts">
import { ROUTER_PATHS } from '@/lib/router/router-paths'
import { useTitle } from '@vueuse/core'
import { ComputerIcon, LibraryBigIcon } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  DiscordIcon,
  GitHubIcon,
  SteamIcon,
  TelegramIcon,
  TwitchIcon,
  YouTubeIcon,
} from 'vue3-simple-icons'

const title = useTitle()
onMounted(() => title.value = 'Лешот.ру')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="w-full max-w-4xl">
      <div class="grid grid-cols-3 gap-4" style="grid-template-rows: repeat(4, 1fr)">
        <RouterLink :to="ROUTER_PATHS.home" class="col-start-1 col-span-2 row-start-1 row-span-2 rounded-2xl overflow-hidden">
          <img src="/images/lexot.webp" alt="Лешот" class="w-full h-full object-cover">
        </RouterLink>
        <RouterLink
          :to="ROUTER_PATHS.dbGames" class="col-start-3 row-start-1 rounded-2xl flex flex-col justify-center p-6 text-white"
          style="background-color: #166534CC"
        >
          <div class="flex items-center mb-3">
            <LibraryBigIcon class="w-10 h-10 mr-3" />
            <h3 class="text-xl font-bold">
              Кладовка
            </h3>
          </div>
          <p class="mt-1 opacity-90 text-sm">
            База данных игр и кинолент
          </p>
        </RouterLink>
        <RouterLink
          :to="ROUTER_PATHS.pc" class="col-start-3 row-start-2 rounded-2xl flex flex-col justify-center p-6 text-white"
          style="background-color: #925f0dCC"
        >
          <div class="flex items-center mb-3">
            <ComputerIcon class="w-10 h-10 mr-3" />
            <h3 class="text-xl font-bold">
              Железо
            </h3>
          </div>
          <p class="mt-1 opacity-90 text-sm">
            Конфигурация компьютера и периферия
          </p>
        </RouterLink>
        <a
          href="https://steamcommunity.com/id/le_xot" target="_blank"
          class="row-start-3 rounded-2xl flex flex-col justify-center p-6 text-white"
          style="background-color: #000000CC"
        >
          <div class="flex items-center mb-3">
            <SteamIcon class="w-10 h-10 mr-3" />
            <h3 class="text-xl font-bold">Steam</h3>
          </div>
          <p class="mt-1 opacity-90 text-sm">Мой личный архив пиксельных приключений</p>
        </a>
        <a
          href="https://github.com/le-xot" target="_blank"
          class="row-start-3 rounded-2xl flex flex-col justify-center p-6 text-white"
          style="background-color: #181717CC"
        >
          <div class="flex items-center mb-3">
            <GitHubIcon class="w-10 h-10 mr-3" />
            <h3 class="text-xl font-bold">GitHub</h3>
          </div>
          <p class="mt-1 opacity-90 text-sm">Код, который иногда работает</p>
        </a>
        <a
          href="https://t.me/le_xot" target="_blank"
          class="row-start-3 rounded-2xl flex flex-col justify-center p-6 text-white"
          style="background-color: #26A5E4CC"
        >
          <div class="flex items-center mb-3">
            <TelegramIcon class="w-10 h-10 mr-3" />
            <h3 class="text-xl font-bold">Telegram</h3>
          </div>
          <p class="mt-1 opacity-90 text-sm">Самый быстрый способ достучаться</p>
        </a>
        <a
          href="https://twir.app/s/lexotovo" target="_blank"
          class="row-start-4 rounded-2xl flex flex-col justify-center p-6 text-white"
          style="background-color: #5865F2CC"
        >
          <div class="flex items-center mb-3">
            <DiscordIcon class="w-10 h-10 mr-3" />
            <h3 class="text-xl font-bold">Discord</h3>
          </div>
          <p class="mt-1 opacity-90 text-sm">Деревня Лешотово</p>
        </a>
        <a
          href="https://www.twitch.tv/etonelexot" target="_blank"
          class="row-start-4 rounded-2xl flex flex-col justify-center p-6 text-white"
          style="background-color: #9146FFCC"
        >
          <div class="flex items-center mb-3">
            <TwitchIcon class="w-10 h-10 mr-3" />
            <h3 class="text-xl font-bold">Twitch</h3>
          </div>
          <p class="mt-1 opacity-90 text-sm">Стримлю, когда не ленюсь</p>
        </a>
        <a
          href="https://www.youtube.com/@le_xot" target="_blank"
          class="row-start-4 rounded-2xl flex flex-col justify-center p-6 text-white"
          style="background-color: #FF0000CC"
        >
          <div class="flex items-center mb-3">
            <YouTubeIcon class="w-10 h-10 mr-3" />
            <h3 class="text-xl font-bold">YouTube</h3>
          </div>
          <p class="mt-1 opacity-90 text-sm">Канал, застрявший в золотой эпохе летсплеев</p>
        </a>
      </div>
    </div>
  </div>
</template>
