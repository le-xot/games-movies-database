import type { RecordGenre } from '@/lib/api'
import type { GENRES } from '@/lib/genre-registry'
import type { ROUTE_TABLE } from '@/router/router-paths'
import type { RouteRecordInfo } from 'vue-router'

/** Жанровые маршруты генерируются из реестра, остальные — из `ROUTE_TABLE`. */
type GenreRouteMap = {
  [Entry in (typeof GENRES)[number] as Entry['routeName']]: RouteRecordInfo<
    Entry['routeName'],
    Entry['path']
  >
}

type StaticRouteMap = {
  [Name in keyof typeof ROUTE_TABLE]: RouteRecordInfo<Name, (typeof ROUTE_TABLE)[Name]>
}

/**
 * Аугментация vue-router: карта имён выводится из `ROUTE_TABLE` и реестра жанров,
 * а не переписывается руками. Dev-проверка в router.ts ловит маршрут, забытый в таблице.
 */
declare module 'vue-router' {
  interface RouteMeta {
    genre?: RecordGenre
    requiresAdmin?: boolean
    requiresAuth?: boolean
    hideForAdmin?: boolean
    provider?: 'twitch' | 'kick'
    /** Стабильный ключ страницы: маршруты с одинаковым ключом не пересоздают компонент. */
    pageKey?: string
    /** Заголовок документа; ставится после навигации (`router.afterEach`). */
    title?: string
    /** `false` — не добавлять суффикс «Лешота». */
    titleSuffix?: boolean
  }

  interface TypesConfig {
    RouteNamedMap: StaticRouteMap & GenreRouteMap
  }
}
