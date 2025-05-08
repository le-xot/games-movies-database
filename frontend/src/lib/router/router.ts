import { useUser } from '@/composables/use-user'
import { createRouter, createWebHistory } from 'vue-router'
import { ROUTER_PATHS } from './router-paths.ts'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth/callback',
      component: () => import('@/pages/auth/callback.vue'),
    },
    {
      path: ROUTER_PATHS.home,
      component: () => import('@/layout/home/layout-home.vue'),
      children: [
        {
          path: ROUTER_PATHS.home,
          component: () => import('@/pages/home/home.vue'),
        },
        {
          path: ROUTER_PATHS.pc,
          component: () => import('@/pages/pc/pc.vue'),
        },
      ],
    },
    {
      path: ROUTER_PATHS.db,
      component: () => import('@/layout/db/layout-database.vue'),
      redirect: { path: ROUTER_PATHS.dbQueue },
      children: [
        {
          path: ROUTER_PATHS.admin,
          component: () => import('@/pages/admin/admin.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: ROUTER_PATHS.profile,
          component: () => import('@/pages/profile/profile.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: ROUTER_PATHS.dbQueue,
          component: () => import('@/pages/queue/queue.vue'),
        },
        {
          path: ROUTER_PATHS.dbSuggestion,
          component: () => import('@/pages/suggestion/suggestion.vue'),
        },
        {
          path: ROUTER_PATHS.dbAnime,
          component: () => import('@/pages/anime/anime.vue'),
        },
        {
          path: ROUTER_PATHS.dbGames,
          component: () => import('@/pages/games/games.vue'),
        },
        {
          path: ROUTER_PATHS.dbMovie,
          component: () => import('@/pages/movie/movie.vue'),
        },
        {
          path: ROUTER_PATHS.dbCartoon,
          component: () => import('@/pages/cartoon/cartoon.vue'),
        },
        {
          path: ROUTER_PATHS.dbSeries,
          component: () => import('@/pages/series/series.vue'),
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

router.beforeEach(async (to, _, next) => {
  const userStore = useUser()
  if (!userStore.isInitialized) {
    try {
      await userStore.fetchUser()
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    }
  }

  if (to.meta.requiresAdmin) {
    if (!userStore.isAdmin) {
      next({ path: ROUTER_PATHS.home })
    } else {
      next()
    }
  } else if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      next({ path: ROUTER_PATHS.home })
    } else {
      next()
    }
  } else {
    next()
  }
})
