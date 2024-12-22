import { createRouter, createWebHistory } from 'vue-router'
import { ROUTER_PATHS } from './router-paths.ts'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
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
          path: ROUTER_PATHS.dbQueue,
          component: () => import('@/pages/queue/queue.vue'),
        },
        {
          path: ROUTER_PATHS.dbVideos,
          component: () => import('@/pages/videos/videos.vue'),
        },
        {
          path: ROUTER_PATHS.dbGames,
          component: () => import('@/pages/games/games.vue'),
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
