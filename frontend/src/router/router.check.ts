import { GENRES } from '@/lib/genre-registry'
import { router } from '@/router/router'
import { ROUTE_TABLE } from '@/router/router-paths'
import type { RouteMap } from 'vue-router'

type PathOf<K extends keyof RouteMap> = RouteMap[K]['path']
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Expect<T extends true> = T

type StaticNames = keyof typeof ROUTE_TABLE
type GenreName = (typeof GENRES)[number]['routeName']

/** Все имена из `RouteNamedMap` приходят из таблицы маршрутов или реестра жанров. */
type _NoOrphanNames = Expect<Equals<Exclude<keyof RouteMap, StaticNames | GenreName>, never>>

/** Путь жанрового маршрута берётся из реестра, а не из ручной карты. */
type _GamesPath = Expect<Equals<PathOf<'games'>, '/db/games'>>
type _AnimePath = Expect<Equals<PathOf<'anime'>, '/db/anime'>>

export const routeChecks: [_NoOrphanNames, _GamesPath, _AnimePath] = [true, true, true]

// должно компилироваться
void router.push({ name: 'games' })
// @ts-expect-error неизвестное имя
void router.push({ name: 'games-typo' })
