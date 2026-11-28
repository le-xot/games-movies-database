import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { GENRES } from '@/lib/genre-registry'
import { isTelegramEnvironment } from '@/lib/telegram-webapp'
import { ROUTE_TABLE, ROUTER_PATHS, type RouteName } from '@/router/router-paths'
import { useTitle } from '@/stores/use-title'
import { useUser } from '@/stores/use-user'
import type { RouteMap, RouteRecordRaw, RouterHistory } from 'vue-router'

/** Жанровые маршруты генерируются из реестра: новый жанр — одна запись там. */
const GENRE_ROUTES = GENRES.map((entry) => ({
  path: entry.path,
  name: entry.routeName,
  component: () => import('@/pages/media/MediaPage.vue'),
  meta: { genre: entry.genre, pageKey: 'media', title: entry.label },
}))

const ROUTES: RouteRecordRaw[] = [
  {
    path: ROUTER_PATHS.authTwitch,
    name: 'auth-twitch',
    meta: { provider: 'twitch', title: 'Вход' },
    component: () => import('@/pages/auth/OAuthCallback.vue'),
  },
  {
    path: ROUTER_PATHS.authKick,
    name: 'auth-kick',
    meta: { provider: 'kick', title: 'Вход' },
    component: () => import('@/pages/auth/OAuthCallback.vue'),
  },
  {
    path: ROUTER_PATHS.authTelegram,
    name: 'auth-telegram',
    meta: { title: 'Вход' },
    component: () => import('@/pages/auth/TelegramCallback.vue'),
  },
  {
    path: ROUTER_PATHS.home,
    name: 'home-layout',
    component: () => import('@/components/layout/home/LayoutHome.vue'),
    meta: { title: 'Лешот' },
    children: [
      {
        path: ROUTER_PATHS.home,
        name: 'home',
        component: () => import('@/pages/home/HomePage.vue'),
        meta: { title: 'Лешот — сайт Лешота', titleSuffix: false },
      },
      {
        path: ROUTER_PATHS.pc,
        name: 'pc',
        component: () => import('@/pages/pc/PcPage.vue'),
        meta: { title: 'Сетап Лешота', titleSuffix: false },
      },
    ],
  },
  {
    path: ROUTER_PATHS.db,
    name: 'db',
    component: () => import('@/components/layout/db/LayoutDatabase.vue'),
    meta: { title: 'База' },
    redirect: { path: ROUTER_PATHS.dbSuggestion },
    children: [
      {
        path: ROUTER_PATHS.admin,
        name: 'admin',
        component: () => import('@/pages/admin/AdminPage.vue'),
        meta: { requiresAdmin: true, title: 'Админка' },
      },
      {
        path: ROUTER_PATHS.dbSuggestion,
        name: 'suggestion',
        meta: { title: 'Советы' },
        component: () => import('@/pages/suggestion/SuggestionPage.vue'),
      },
      {
        path: ROUTER_PATHS.dbStats,
        name: 'stats',
        meta: { title: 'Статистика' },
        component: () => import('@/pages/stats/StatsPage.vue'),
      },
      {
        path: ROUTER_PATHS.friends,
        name: 'friends',
        meta: { title: 'Друзья' },
        component: () => import('@/pages/friends/FriendsPage.vue'),
      },
      {
        path: ROUTER_PATHS.myRatings,
        name: 'my-ratings',
        component: () => import('@/pages/ratings/UserRatingsPage.vue'),
        meta: { requiresAuth: true, hideForAdmin: true, title: 'Мои оценки' },
      },
      {
        path: ROUTER_PATHS.userRatings,
        name: 'user-ratings',
        meta: { title: 'Оценки пользователя' },
        component: () => import('@/pages/ratings/UserRatingsPage.vue'),
      },
      ...GENRE_ROUTES,
      {
        path: ROUTER_PATHS.wordle,
        name: 'wordle',
        meta: { title: 'Вордли' },
        component: () => import('@/pages/wordle/WordlePage.vue'),
      },
      {
        path: ROUTER_PATHS.cocktails,
        name: 'cocktails',
        meta: { title: 'Коктейли' },
        component: () => import('@/pages/cocktails/CocktailsPage.vue'),
      },
    ],
  },
  {
    // Telegram Mini App: своя оболочка без сайтовой, вход по initData.
    path: ROUTER_PATHS.wordleMiniApp,
    name: 'wordle-miniapp',
    component: () => import('@/pages/wordle/WordleMiniAppPage.vue'),
    meta: { title: 'Вордли' },
  },
  {
    path: ROUTER_PATHS.notFound,
    name: 'not-found',
    redirect: ROUTER_PATHS.home,
  },
]

/** В браузере — история URL, в тестах (без `window`) — memory history. */
function defaultHistory(): RouterHistory {
  return typeof window === 'undefined' ? createMemoryHistory() : createWebHistory()
}

/** Ожидаемые имена: `ROUTE_TABLE` для обычных маршрутов + реестр жанров для жанровых. */
export const EXPECTED_ROUTE_NAMES: readonly (keyof RouteMap)[] = [
  ...(Object.keys(ROUTE_TABLE) as RouteName[]),
  ...GENRES.map((entry) => entry.routeName),
]

/**
 * Собирает роутер: маршруты из `ROUTE_TABLE`/реестра жанров, заголовок из `meta.title`,
 * auth-guard и dev-проверки. Экспортируется для тестов на memory history.
 */
export function createAppRouter(history: RouterHistory = defaultHistory()) {
  const router = createRouter({
    history,
    scrollBehavior: () => ({ top: 0 }),
    routes: ROUTES,
  })

  router.afterEach((to) => {
    const title = to.meta.title
    if (!title) return

    useTitle().setTitle(title, { suffix: to.meta.titleSuffix !== false })
  })

  router.beforeEach(async (to) => {
    // Прямой заход в Mini App (без данных Telegram) — ведём на обычную страницу:
    // без initData войти внутрь нельзя, а сайт умеет работать и в браузере.
    if (to.name === 'wordle-miniapp' && !isTelegramEnvironment()) {
      return { path: ROUTER_PATHS.wordle }
    }

    const userStore = useUser()

    if (!to.meta.requiresAdmin && !to.meta.requiresAuth && !to.meta.hideForAdmin) return

    await userStore.whenQuerySettled()

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

  if (import.meta.env?.DEV) {
    const registered = router
      .getRoutes()
      .map((route) => route.name)
      .filter((name): name is string => typeof name === 'string')
    const missing = EXPECTED_ROUTE_NAMES.filter((name) => !registered.includes(name))
    const duplicates = [...new Set(registered.filter((name, i) => registered.indexOf(name) !== i))]
    if (missing.length > 0) console.warn(`[router] отсутствуют маршруты: ${missing.join(', ')}`)
    if (duplicates.length > 0)
      console.warn(`[router] дублирующиеся имена: ${duplicates.join(', ')}`)

    const untitled = router
      .getRoutes()
      .filter((route) => !route.redirect && !route.meta.title)
      .map((route) => route.name)
    if (untitled.length > 0)
      console.warn(`[router] маршруты без meta.title: ${untitled.join(', ')}`)
  }

  return router
}

/**
 * Имена, реально объявленные в `ROUTES`. Список статический (жанровые — выражением),
 * чтобы typecheck ловил удаление/добавление записи в `ROUTE_TABLE` без правки этой строки:
 * проверки живут в `router.check.ts`.
 */
export const ROUTE_NAMES_USED = [
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
  'wordle',
  'cocktails',
  'wordle-miniapp',
  'auth-twitch',
  'auth-kick',
  'auth-telegram',
  'not-found',
] as const satisfies readonly RouteName[]

export const router = createAppRouter()

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
