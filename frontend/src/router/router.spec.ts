import { describe, expect, it } from 'bun:test'
import { createMemoryHistory } from 'vue-router'
import { GENRES } from '@/lib/genre-registry'
import { EXPECTED_ROUTE_NAMES, createAppRouter } from '@/router/router'
import { ROUTE_TABLE } from '@/router/router-paths'

const build = () => createAppRouter(createMemoryHistory())

const registeredNames = (router: ReturnType<typeof build>) =>
  router
    .getRoutes()
    .map((route) => route.name)
    .filter((name): name is string => typeof name === 'string')
    .sort()

describe('router', () => {
  it('регистрирует ровно ожидаемые имена (таблица + реестр жанров)', () => {
    expect(registeredNames(build())).toEqual([...EXPECTED_ROUTE_NAMES].sort())
  })

  it('пути обычных маршрутов совпадают с ROUTE_TABLE', () => {
    const byName = new Map(
      build()
        .getRoutes()
        .map((route) => [route.name, route]),
    )

    for (const [name, path] of Object.entries(ROUTE_TABLE)) {
      expect(byName.get(name)?.path).toBe(path)
    }
  })

  it('жанровые маршруты приходят из реестра вместе с meta', () => {
    const byName = new Map(
      build()
        .getRoutes()
        .map((route) => [route.name, route]),
    )

    for (const entry of GENRES) {
      const route = byName.get(entry.routeName)
      expect(route?.path).toBe(entry.path)
      expect(route?.meta.genre).toBe(entry.genre)
      expect(route?.meta.pageKey).toBe('media')
    }
  })

  it('у каждого не-redirect маршрута есть meta.title', () => {
    const untitled = build()
      .getRoutes()
      .filter((route) => !route.redirect && !route.meta.title)
      .map((route) => route.name)

    expect(untitled).toEqual([])
  })
})
