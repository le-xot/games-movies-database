import type { RecordGenre } from '@/lib/api'
import type { RouteRecordInfo } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    genre?: RecordGenre
    requiresAuth?: boolean
    requiresAdmin?: boolean
    provider?: 'twitch' | 'kick'
  }

  interface TypesConfig {
    RouteNamedMap: {
      home: RouteRecordInfo<'home', '/'>
      'home-layout': RouteRecordInfo<'home-layout', '/'>
      pc: RouteRecordInfo<'pc', '/pc'>
      db: RouteRecordInfo<'db', '/db'>
      admin: RouteRecordInfo<'admin', '/db/admin'>
      suggestion: RouteRecordInfo<'suggestion', '/db/suggestion'>
      stats: RouteRecordInfo<'stats', '/db/stats'>
      anime: RouteRecordInfo<'anime', '/db/anime'>
      games: RouteRecordInfo<'games', '/db/games'>
      movie: RouteRecordInfo<'movie', '/db/movie'>
      cartoon: RouteRecordInfo<'cartoon', '/db/cartoon'>
      series: RouteRecordInfo<'series', '/db/series'>
      wordle: RouteRecordInfo<'wordle', '/db/wordle'>
      'auth-twitch': RouteRecordInfo<'auth-twitch', '/auth/callback/twitch'>
      'auth-kick': RouteRecordInfo<'auth-kick', '/auth/callback/kick'>
      'auth-telegram': RouteRecordInfo<'auth-telegram', '/auth/callback/telegram'>
      'not-found': RouteRecordInfo<'not-found', '/:pathMatch(.*)*'>
    }
  }
}
