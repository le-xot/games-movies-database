import { ComputerIcon, LibraryBigIcon, UserIcon } from 'lucide-vue-next'
import {
  DiscordIcon,
  GitHubIcon,
  SteamIcon,
  TelegramIcon,
  TwitchIcon,
  YouTubeIcon,
} from 'vue3-simple-icons'
import type { Component } from 'vue'

export interface BentoItem {
  name: string
  description?: string
  icon: Component
  href: string
  cta?: string
  class: string
  bgColor?: string
  background?: 'image'
}

export const BENTO_ITEMS: BentoItem[] = [
  {
    name: 'Лешот',
    description: 'Создатель сайта',
    icon: UserIcon,
    href: '',
    class: 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2',
    background: 'image',
  },
  {
    name: 'Кладовка',
    description: 'База данных игр и кинолент',
    icon: LibraryBigIcon,
    href: '/db/games',
    class: 'col-span-1',
    bgColor: '#166534',
  },
  {
    name: 'Железо',
    description: 'Конфигурация компьютера и прочих штук',
    icon: ComputerIcon,
    href: '/pc',
    class: 'col-span-1',
    bgColor: '#925f0d',
  },

  { name: 'Steam', description: 'Мой личный архив пиксельных приключений', icon: SteamIcon, href: 'https://steamcommunity.com/id/le_xot', bgColor: '#000000', class: 'col-span-1' },
  { name: 'GitHub', description: 'Код, который иногда работает', icon: GitHubIcon, href: 'https://github.com/le-xot', bgColor: '#181717', class: 'col-span-1' },
  { name: 'Telegram', description: 'Самый быстрый способ до меня достучаться', icon: TelegramIcon, href: 'https://t.me/le_xot', bgColor: '#26A5E4', class: 'col-span-1' },
  { name: 'Discord', description: 'Место, где я не притворяюсь', icon: DiscordIcon, href: 'https://discord.gg/zgZHHnkkP5', bgColor: '#5865F2', class: 'col-span-1' },
  { name: 'Twitch', description: 'Стримлю, когда не ленюсь', icon: TwitchIcon, href: 'https://www.twitch.tv/etonelexot', bgColor: '#9146FF', class: 'col-span-1' },
  { name: 'YouTube', description: 'Канал, застрявший в золотой эпохе летсплеев', icon: YouTubeIcon, href: 'https://www.youtube.com/@le_xot', bgColor: '#FF0000', class: 'col-span-1' },
]
