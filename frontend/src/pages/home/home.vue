<script setup lang="ts">
import { ComputerIcon, LibraryBigIcon } from 'lucide-vue-next'
import {
  DiscordIcon,
  GitHubIcon,
  SteamIcon,
  TelegramIcon,
  TwitchIcon,
  YouTubeIcon,
} from 'vue3-simple-icons'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="w-full max-w-5xl">
      <div class="grid grid-cols-3 gap-6" style="grid-template-rows: repeat(4, 1fr)">
        <a href="/" class="col-start-1 col-span-2 row-start-1 row-span-2 rounded-3xl overflow-hidden">
          <img src="/images/lexot.webp" alt="Лешот" class="w-full h-full object-cover">
        </a>
        <a
          href="/db/games" class="col-start-3 row-start-1 rounded-3xl flex flex-col justify-center p-8 text-white"
          style="background-color: #166534CC"
        >
          <LibraryBigIcon class="w-12 h-12 mb-4" />
          <h3 class="text-2xl font-bold">Кладовка</h3>
          <p class="mt-2 opacity-90">База данных игр и кинолент</p>
        </a>
        <a
          href="/pc" class="col-start-3 row-start-2 rounded-3xl flex flex-col justify-center p-8 text-white"
          style="background-color: #925f0dCC"
        >
          <ComputerIcon class="w-12 h-12 mb-4" />
          <h3 class="text-2xl font-bold">Железо</h3>
          <p class="mt-2 opacity-90">Конфигурация компьютера и периферия</p>
        </a>
        <a
          href="https://steamcommunity.com/id/le_xot" target="_blank" rel="noopener"
          class="row-start-3 rounded-3xl flex flex-col justify-center p-8 text-white"
          style="background-color: #000000CC"
        >
          <SteamIcon class="w-12 h-12 mb-4" />
          <h3 class="text-2xl font-bold">Steam</h3>
          <p class="mt-2 opacity-90">Мой личный архив пиксельных приключений</p>
        </a>
        <a
          href="https://github.com/le-xot" target="_blank" rel="noopener"
          class="row-start-3 rounded-3xl flex flex-col justify-center p-8 text-white"
          style="background-color: #181717CC"
        >
          <GitHubIcon class="w-12 h-12 mb-4" />
          <h3 class="text-2xl font-bold">GitHub</h3>
          <p class="mt-2 opacity-90">Код, который иногда работает</p>
        </a>
        <a
          href="https://t.me/le_xot" target="_blank" rel="noopener"
          class="row-start-3 rounded-3xl flex flex-col justify-center p-8 text-white"
          style="background-color: #26A5E4CC"
        >
          <TelegramIcon class="w-12 h-12 mb-4" />
          <h3 class="text-2xl font-bold">Telegram</h3>
          <p class="mt-2 opacity-90">Самый быстрый способ достучаться</p>
        </a>
        <a
          href="https://discord.gg/zgZHHnkkP5" target="_blank" rel="noopener"
          class="row-start-4 rounded-3xl flex flex-col justify-center p-8 text-white"
          style="background-color: #5865F2CC"
        >
          <DiscordIcon class="w-12 h-12 mb-4" />
          <h3 class="text-2xl font-bold">Discord</h3>
          <p class="mt-2 opacity-90">Деревня Лешотово</p>
        </a>
        <a
          href="https://www.twitch.tv/etonelexot" target="_blank" rel="noopener"
          class="row-start-4 rounded-3xl flex flex-col justify-center p-8 text-white"
          style="background-color: #9146FFCC"
        >
          <TwitchIcon class="w-12 h-12 mb-4" />
          <h3 class="text-2xl font-bold">Twitch</h3>
          <p class="mt-2 opacity-90">Стримлю, когда не ленюсь</p>
        </a>
        <a
          href="https://www.youtube.com/@le_xot" target="_blank" rel="noopener"
          class="row-start-4 rounded-3xl flex flex-col justify-center p-8 text-white"
          style="background-color: #FF0000CC"
        >
          <YouTubeIcon class="w-12 h-12 mb-4" />
          <h3 class="text-2xl font-bold">YouTube</h3>
          <p class="mt-2 opacity-90">Канал, застрявший в золотой эпохе летсплеев</p>
        </a>
      </div>
    </div>
  </div>
</template>
