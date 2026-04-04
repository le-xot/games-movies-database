import { createRouter, createWebHistory } from 'vue-router';
import { useUser } from '@/stores/use-user';
import { ROUTER_PATHS } from './router-paths';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth/callback',
      component: () => import('@/pages/auth/AuthCallback.vue'),
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
      redirect: { path: ROUTER_PATHS.dbQueue },
      children: [
        {
          path: ROUTER_PATHS.admin,
          component: () => import('@/pages/admin/AdminPage.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: ROUTER_PATHS.profile,
          component: () => import('@/pages/profile/ProfilePage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: ROUTER_PATHS.dbAuction,
          component: () => import('@/pages/auction/AuctionPage.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: ROUTER_PATHS.dbQueue,
          component: () => import('@/pages/queue/QueuePage.vue'),
        },
        {
          path: ROUTER_PATHS.dbSuggestion,
          component: () => import('@/pages/suggestion/SuggestionPage.vue'),
        },
        {
          path: ROUTER_PATHS.dbAnime,
          component: () => import('@/pages/anime/AnimePage.vue'),
        },
        {
          path: ROUTER_PATHS.dbGames,
          component: () => import('@/pages/games/GamesPage.vue'),
        },
        {
          path: ROUTER_PATHS.dbMovie,
          component: () => import('@/pages/movie/MoviePage.vue'),
        },
        {
          path: ROUTER_PATHS.dbCartoon,
          component: () => import('@/pages/cartoon/CartoonPage.vue'),
        },
        {
          path: ROUTER_PATHS.dbSeries,
          component: () => import('@/pages/series/SeriesPage.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: ROUTER_PATHS.home,
    },
  ],
});

router.beforeEach(async (to, _, next) => {
  const userStore = useUser();
  const requiresAuth = to.meta.requiresAuth || to.meta.requiresAdmin;

  if (requiresAuth) {
    if (!userStore.isInitialized) {
      try {
        await userStore.fetchUser();
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    }

    if (to.meta.requiresAdmin) {
      if (!userStore.isAdmin) {
        next({ path: ROUTER_PATHS.home });
      } else {
        next();
      }
    } else if (!userStore.isLoggedIn) {
      next({ path: ROUTER_PATHS.home });
    } else {
      next();
    }
  } else {
    if (!userStore.isInitialized) {
      void userStore.fetchUser();
    }
    next();
  }
});
