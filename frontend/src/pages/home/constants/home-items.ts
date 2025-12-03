import { ROUTER_PATHS } from '@/lib/router/router-paths'

export interface GridItem {
  title: string
  description: string
  path: string
  color: string
  external?: boolean
}

export const HOME_GRID_ITEMS: GridItem[] = [
  {
    title: 'Кладовка',
    description: 'База данных игр и кинолент',
    path: ROUTER_PATHS.dbGames,
    color: '#166534CC',
  },
  {
    title: 'Железяки',
    description: 'Конфигурация компьютера и периферия',
    path: ROUTER_PATHS.pc,
    color: '#925f0dCC',
  },
  {
    title: 'Steam',
    description: 'Архив пиксельных приключений',
    path: 'https://steamcommunity.com/id/le_xot',
    color: '#000000CC',
    external: true,
  },
  {
    title: 'GitHub',
    description: 'Код, который иногда работает',
    path: 'https://github.com/le-xot',
    color: '#181717CC',
    external: true,
  },
  {
    title: 'Telegram',
    description: 'Быстрый способ достучаться',
    path: 'https://t.me/le_xot',
    color: '#26A5E4CC',
    external: true,
  },
  {
    title: 'Discord',
    description: 'Деревня "Лешотово"',
    path: 'https://twir.app/s/lexotovo',
    color: '#5865F2CC',
    external: true,
  },
  {
    title: 'Twitch',
    description: 'Стримлю, когда не ленюсь',
    path: 'https://www.twitch.tv/etonelexot',
    color: '#9146FFCC',
    external: true,
  },
  {
    title: 'YouTube',
    description: 'Канал, прямиком из эпохи летсплеев',
    path: 'https://www.youtube.com/@le_xot',
    color: '#FF0000CC',
    external: true,
  },
]
