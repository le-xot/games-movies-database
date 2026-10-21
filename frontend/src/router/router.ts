import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { RecordGenre } from '@/lib/api'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useUser } from '@/stores/use-user'
import type { RouteMap } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/auth/callback/twitch',
      name: 'auth-twitch',
      component: () => import('@/pages/auth/OAuthCallback.vue'),
      meta: { provider: 'twitch' },
    },
    {
      path: '/auth/callback/kick',
      name: 'auth-kick',
      component: () => import('@/pages/auth/OAuthCallback.vue'),
      meta: { provider: 'kick' },
    },
    {
      path: '/auth/callback/telegram',
      name: 'auth-telegram',
      component: () => import('@/pages/auth/TelegramCallback.vue'),
    },
    {
      path: ROUTER_PATHS.home,
      name: 'home-layout',
      component: () => import('@/components/layout/home/LayoutHome.vue'),
      children: [
        {
          path: ROUTER_PATHS.home,
          name: 'home',
          component: () => import('@/pages/home/HomePage.vue'),
        },
        {
          path: ROUTER_PATHS.pc,
          name: 'pc',
          component: () => import('@/pages/pc/PcPage.vue'),
        },
      ],
    },
    {
      path: ROUTER_PATHS.db,
      name: 'db',
      component: () => import('@/components/layout/db/LayoutDatabase.vue'),
      redirect: { path: ROUTER_PATHS.dbSuggestion },
      children: [
        {
          path: ROUTER_PATHS.admin,
          name: 'admin',
          component: () => import('@/pages/admin/AdminPage.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: ROUTER_PATHS.dbSuggestion,
          name: 'suggestion',
          component: () => import('@/pages/suggestion/SuggestionPage.vue'),
        },
        {
          path: ROUTER_PATHS.dbStats,
          name: 'stats',
          component: () => import('@/pages/stats/StatsPage.vue'),
        },
        {
          path: ROUTER_PATHS.friends,
          name: 'friends',
          component: () => import('@/pages/friends/FriendsPage.vue'),
        },
        {
          path: ROUTER_PATHS.myRatings,
          name: 'my-ratings',
          component: () => import('@/pages/ratings/UserRatingsPage.vue'),
          meta: { requiresAuth: true, hideForAdmin: true },
        },
        {
          path: ROUTER_PATHS.userRatings,
          name: 'user-ratings',
          component: () => import('@/pages/ratings/UserRatingsPage.vue'),
        },
        {
          path: ROUTER_PATHS.dbAnime,
          name: 'anime',
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.ANIME, pageKey: 'media' },
        },
        {
          path: ROUTER_PATHS.dbGames,
          name: 'games',
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.GAME, pageKey: 'media' },
        },
        {
          path: ROUTER_PATHS.dbMovie,
          name: 'movie',
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.MOVIE, pageKey: 'media' },
        },
        {
          path: ROUTER_PATHS.dbCartoon,
          name: 'cartoon',
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.CARTOON, pageKey: 'media' },
        },
        {
          path: ROUTER_PATHS.dbSeries,
          name: 'series',
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.SERIES, pageKey: 'media' },
        },
        {
          path: ROUTER_PATHS.wordle,
          name: 'wordle',
          component: () => import('@/pages/wordle/WordlePage.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: ROUTER_PATHS.home,
    },
  ],
})

/** Заранее подгружает чанки страницы, чтобы переход по клику не ждал сеть. */
export function prefetchRouteChunks(path: string) {
  for (const record of router.resolve(path).matched) {
    for (const component of Object.values(record.components ?? {})) {
      if (typeof component === 'function') {
        void (component as () => Promise<unknown>)().catch(() => {})
      }
    }
  }
}

/** Синхронизировано с TypesConfig.RouteNamedMap (src/types/vue-router.d.ts): при добавлении маршрута обновить оба места. */
const EXPECTED_ROUTE_NAMES = [
  'home-layout',
  'home',
  'pc',
  'db',
  'admin',
  'suggestion',
  'stats',
  'friends',
  'my-ratings',
  'user-ratings',
  'anime',
  'games',
  'movie',
  'cartoon',
  'series',
  'wordle',
  'auth-twitch',
  'auth-kick',
  'auth-telegram',
  'not-found',
] as const satisfies readonly (keyof RouteMap)[]

if (import.meta.env.DEV) {
  const registered = router
    .getRoutes()
    .map((route) => route.name)
    .filter((name): name is string => typeof name === 'string')
  const missing = EXPECTED_ROUTE_NAMES.filter((name) => !registered.includes(name))
  const duplicates = [...new Set(registered.filter((name, i) => registered.indexOf(name) !== i))]
  if (missing.length > 0) console.warn(`[router] отсутствуют маршруты: ${missing.join(', ')}`)
  if (duplicates.length > 0) console.warn(`[router] дублирующиеся имена: ${duplicates.join(', ')}`)
}

router.beforeEach(async (to) => {
  const userStore = useUser()

  if (!to.meta.requiresAdmin && !to.meta.requiresAuth && !to.meta.hideForAdmin) return

  if (userStore.isLoading) {
    await Promise.race([
      new Promise<void>((resolve) => {
        const stop = watch(
          () => userStore.isLoading,
          (loading) => {
            if (!loading) {
              stop()
              resolve()
            }
          },
        )
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ])
  }

  if (!userStore.isLoggedIn) {
    return { path: ROUTER_PATHS.home }
  }

  if (to.meta.hideForAdmin && userStore.isRealAdmin) {
    return { path: ROUTER_PATHS.home }
  }

  if (to.meta.requiresAdmin && !userStore.isRealAdmin) {
    return { path: ROUTER_PATHS.home }
  }
})
