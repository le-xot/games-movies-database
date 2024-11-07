import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      alias: ['/db'],
      path: '/db/queue',
      component: () => import('@src/pages/table-queue.vue'),
    },
    {
      path: '/db/videos',
      component: () => import('@src/pages/table-videos.vue'),
    },
    {
      path: '/db/games',
      component: () => import('@src/pages/table-games.vue'),
    },
  ],
})
