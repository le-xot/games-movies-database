import { ChartPie, HandPlatter, HouseIcon, Martini, Puzzle, Star, Users } from '@lucide/vue'
import { computed } from 'vue'
import { NAV_GENRES } from '@/lib/genre-registry'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useUser } from '@/stores/use-user'
import type { RouterPath } from '@/router/router-paths'
import type { Component } from 'vue'

export interface RouteItem {
  name: string
  icon: Component
  path: RouterPath
  requiresAdmin?: boolean
  requiresAuth?: boolean
  hideForAdmin?: boolean
}

export interface NavSection {
  items: RouteItem[]
}

export const dbSections: NavSection[] = [
  {
    items: [{ name: 'Советы', icon: HandPlatter, path: ROUTER_PATHS.dbSuggestion }],
  },
  {
    items: NAV_GENRES.map((entry) => ({
      name: entry.label,
      icon: entry.icon,
      path: entry.path as RouterPath,
    })),
  },
  {
    items: [
      {
        name: 'Мои оценки',
        icon: Star,
        path: ROUTER_PATHS.myRatings,
        requiresAuth: true,
        hideForAdmin: true,
      },
      { name: 'Друзья', icon: Users, path: ROUTER_PATHS.friends },
      { name: 'Статистика', icon: ChartPie, path: ROUTER_PATHS.dbStats },
    ],
  },
]

export const homeNavItem: RouteItem = {
  name: 'На главную',
  icon: HouseIcon,
  path: ROUTER_PATHS.home,
}

export const wordleNavItem: RouteItem = {
  name: 'Вордли',
  icon: Puzzle,
  path: ROUTER_PATHS.wordle,
}

export const cocktailsNavItem: RouteItem = {
  name: 'Коктейли',
  icon: Martini,
  path: ROUTER_PATHS.cocktails,
}

export function useDbNavigation() {
  const userStore = useUser()

  const isItemVisible = (item: RouteItem) =>
    (!item.requiresAdmin || userStore.isRealAdmin) &&
    (!item.requiresAuth || userStore.isLoggedIn) &&
    (!item.hideForAdmin || !userStore.isRealAdmin)

  const sections = computed(() =>
    dbSections
      .map((section) => ({
        items: section.items.filter(isItemVisible),
      }))
      .filter((section) => section.items.length > 0),
  )

  const bottomItems = computed(() =>
    [cocktailsNavItem, wordleNavItem, homeNavItem].filter(isItemVisible),
  )

  return { sections, bottomItems }
}
