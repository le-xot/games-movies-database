import { router } from '@/router/router'
import type { RouteMap } from 'vue-router'

type PathOf<K extends keyof RouteMap> = RouteMap[K]['path']

type _GamesPath = PathOf<'games'> extends '/db/games' ? true : false
export const _ok: _GamesPath = true

// должно компилироваться
void router.push({ name: 'games' })
// @ts-expect-error неизвестное имя
void router.push({ name: 'games-typo' })
