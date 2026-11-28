import { GENRES } from '@/lib/genre-registry'
import { ROUTE_NAMES_USED, router } from '@/router/router'
import type { RouteName } from '@/router/router-paths'
import type { RouteMap } from 'vue-router'

type PathOf<K extends keyof RouteMap> = RouteMap[K]['path']
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Expect<T extends true> = T

type GenreName = (typeof GENRES)[number]['routeName']
type UsedName = (typeof ROUTE_NAMES_USED)[number] | GenreName

/** Все имена из `RouteNamedMap` приходят из таблицы маршрутов или реестра жанров. */
type _NoOrphanNames = Expect<Equals<Exclude<keyof RouteMap, UsedName>, never>>
/** Каждое объявленное в `ROUTES` имя есть в таблице/реестре (ловит удалённую запись). */
type _NoUndeclaredNames = Expect<Equals<Exclude<UsedName, keyof RouteMap>, never>>
/** Обычные имена таблицы покрыты объявленными (ловит забытую запись в `ROUTES`). */
type _NoMissingDeclarations = Expect<
  Equals<Exclude<Exclude<RouteName, GenreName>, (typeof ROUTE_NAMES_USED)[number]>, never>
>

/** Путь жанрового маршрута берётся из реестра, а не из ручной карты. */
type _GamesPath = Expect<Equals<PathOf<'games'>, '/db/games'>>
type _AnimePath = Expect<Equals<PathOf<'anime'>, '/db/anime'>>

export const routeChecks: [
  _NoOrphanNames,
  _NoUndeclaredNames,
  _NoMissingDeclarations,
  _GamesPath,
  _AnimePath,
] = [true, true, true, true, true]

// должно компилироваться
void router.push({ name: 'games' })
// @ts-expect-error неизвестное имя
void router.push({ name: 'games-typo' })
