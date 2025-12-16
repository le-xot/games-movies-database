import { ROUTER_PATHS } from '@/lib/router/router-paths'
import { Cpu, LibraryBig } from 'lucide-vue-next'
import { h, type VNode } from 'vue'
import { DiscordIcon, GitHubIcon, SteamIcon, TelegramIcon, TwitchIcon, YouTubeIcon } from 'vue3-simple-icons'

export interface GridItem {
  title: string
  description: string
  path: string
  color: string
  external?: boolean
  icon: VNode
}

export const HOME_GRID_ITEMS: GridItem[] = [
  {
    title: 'Кладовка',
    description: 'База данных игр и кинолент',
    path: ROUTER_PATHS.dbSuggestion,
    color: '#166534',
    icon: h(LibraryBig),
  },
  {
    title: 'Железяки',
    description: 'Конфигурация компьютера и периферия',
    path: ROUTER_PATHS.pc,
    color: '#925f0d',
    icon: h(Cpu),
  },
  {
    title: 'Telegram',
    description: 'Быстрый способ достучаться',
    path: 'https://t.me/le_xot',
    color: '#26A5E4',
    external: true,
    icon: h(TelegramIcon),
  },
  {
    title: 'GitHub',
    description: 'Код, который иногда работает',
    path: 'https://github.com/le-xot',
    color: '#181717',
    external: true,
    icon: h(GitHubIcon),
  },
  {
    title: 'Steam',
    description: 'Архив пиксельных приключений',
    path: 'https://steamcommunity.com/id/le_xot',
    color: '#000000',
    external: true,
    icon: h(SteamIcon),
  },
  {
    title: 'Discord',
    description: 'Деревня "Лешотово"',
    path: 'https://twir.app/s/lexotovo',
    color: '#5865F2',
    external: true,
    icon: h(DiscordIcon),
  },
  {
    title: 'Twitch',
    description: 'Стримлю, когда не ленюсь',
    path: 'https://www.twitch.tv/etonelexot',
    color: '#9146FF',
    external: true,
    icon: h(TwitchIcon),
  },
  {
    title: 'YouTube',
    description: 'Канал, прямиком из эпохи летсплеев',
    path: 'https://www.youtube.com/@le_xot',
    color: '#FF0000',
    external: true,
    icon: h(YouTubeIcon),
  },
]
