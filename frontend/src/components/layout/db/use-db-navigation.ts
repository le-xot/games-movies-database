import {
  Baby,
  ChartPie,
  Film,
  Gamepad2,
  HandPlatter,
  HouseIcon,
  JapaneseYen,
  Popcorn,
} from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useTitle } from '@/stores/use-title'
import { useUser } from '@/stores/use-user'
import type { Component } from 'vue'

export interface RouteItem {
  name: string
  icon: Component
  path: string
  requiresAdmin?: boolean
}

export interface NavSection {
  items: RouteItem[]
}

export const dbSections: NavSection[] = [
  {
    items: [{ name: 'Советы', icon: HandPlatter, path: ROUTER_PATHS.dbSuggestion }],
  },
  {
    items: [
      { name: 'Игры', icon: Gamepad2, path: ROUTER_PATHS.dbGames },
      { name: 'Аниме', icon: JapaneseYen, path: ROUTER_PATHS.dbAnime },
      { name: 'Фильмы', icon: Film, path: ROUTER_PATHS.dbMovie },
      { name: 'Сериалы', icon: Popcorn, path: ROUTER_PATHS.dbSeries },
      { name: 'Мультфильмы', icon: Baby, path: ROUTER_PATHS.dbCartoon },
    ],
  },
  {
    items: [{ name: 'Статистика', icon: ChartPie, path: ROUTER_PATHS.dbStats }],
  },
]

export const homeNavItem: RouteItem = {
  name: 'На главную',
  icon: HouseIcon,
  path: ROUTER_PATHS.home,
}

export function useDbNavigation() {
  const route = useRoute()
  const { updateTitle } = useTitle()
  const userStore = useUser()

  const sections = computed(() =>
    dbSections
      .map((section) => ({
        items: section.items.filter((r) => !r.requiresAdmin || userStore.isRealAdmin),
      }))
      .filter((section) => section.items.length > 0),
  )

  function handleNavClick(name: string) {
    updateTitle(name)
  }

  function syncTitleFromRoute() {
    const current = dbSections.flatMap((s) => s.items).find((r) => r.path === route.path)
    if (current) updateTitle(current.name)
  }

  return { sections, handleNavClick, syncTitleFromRoute }
}
