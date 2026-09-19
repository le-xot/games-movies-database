import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { RecordGenre } from '@/lib/api'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useUser } from '@/stores/use-user'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth/callback/twitch',
      component: () => import('@/pages/auth/OAuthCallback.vue'),
      meta: { provider: 'twitch' },
    },
    {
      path: '/auth/callback/kick',
      component: () => import('@/pages/auth/OAuthCallback.vue'),
      meta: { provider: 'kick' },
    },
    {
      path: '/auth/callback/telegram',
      component: () => import('@/pages/auth/TelegramCallback.vue'),
    },
    {
      path: ROUTER_PATHS.home,
      component: () => import('@/components/layout/home/LayoutHome.vue'),
      children: [
        {
          path: ROUTER_PATHS.home,
          component: () => import('@/pages/home/HomePage.vue'),
        },
        {
          path: ROUTER_PATHS.pc,
          component: () => import('@/pages/pc/PcPage.vue'),
        },
      ],
    },
    {
      path: ROUTER_PATHS.db,
      component: () => import('@/components/layout/db/LayoutDatabase.vue'),
      redirect: { path: ROUTER_PATHS.dbSuggestion },
      children: [
        {
          path: ROUTER_PATHS.admin,
          component: () => import('@/pages/admin/AdminPage.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: ROUTER_PATHS.dbSuggestion,
          component: () => import('@/pages/suggestion/SuggestionPage.vue'),
        },
        {
          path: ROUTER_PATHS.dbStats,
          component: () => import('@/pages/stats/StatsPage.vue'),
        },
        {
          path: ROUTER_PATHS.dbAnime,
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.ANIME },
        },
        {
          path: ROUTER_PATHS.dbGames,
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.GAME },
        },
        {
          path: ROUTER_PATHS.dbMovie,
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.MOVIE },
        },
        {
          path: ROUTER_PATHS.dbCartoon,
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.CARTOON },
        },
        {
          path: ROUTER_PATHS.dbSeries,
          component: () => import('@/pages/media/MediaPage.vue'),
          meta: { genre: RecordGenre.SERIES },
        },
        {
          path: ROUTER_PATHS.wordle,
          component: () => import('@/pages/wordle/WordlePage.vue'),
          meta: { requiresAuth: true },
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

router.beforeEach(async (to) => {
  const userStore = useUser()
  const requiresAuth = to.meta.requiresAuth || to.meta.requiresAdmin

  if (!requiresAuth) return

  if (userStore.isLoading) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => userStore.isLoading,
        (loading) => {
          if (!loading) {
            stop()
            resolve()
          }
        },
      )
    })
  }

  if (to.meta.requiresAdmin && !userStore.isRealAdmin) {
    return { path: ROUTER_PATHS.home }
  }

  if (!userStore.isLoggedIn) {
    return { path: ROUTER_PATHS.home }
  }
})
