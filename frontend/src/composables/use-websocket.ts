import { useQueryCache } from '@pinia/colada'
import { onMounted, onUnmounted, ref } from 'vue'
import {
  STATS_QUERY_KEY,
  SUGGESTION_QUERY_KEY,
  WORDLE_LEADERBOARD_KEY,
} from '@/composables/query-keys'
import { createEventCoalescer } from '@/composables/use-event-coalescer'
import { useUser } from '@/stores/use-user'
import type { Socket } from 'socket.io-client'

export function useWebSocket() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const queryCache = useQueryCache()
  const userStore = useUser()

  const coalescer = createEventCoalescer({
    handlers: {
      suggestions: () => queryCache.invalidateQueries({ key: [SUGGESTION_QUERY_KEY] }),
      stats: () => queryCache.invalidateQueries({ key: [STATS_QUERY_KEY] }),
      user: () => userStore.refetchUser(),
      wordle: () => queryCache.invalidateQueries({ key: [WORDLE_LEADERBOARD_KEY] }),
      'records:ANIME': () => queryCache.invalidateQueries({ key: ['anime'] }),
      'records:CARTOON': () => queryCache.invalidateQueries({ key: ['cartoon'] }),
      'records:SERIES': () => queryCache.invalidateQueries({ key: ['series'] }),
      'records:MOVIE': () => queryCache.invalidateQueries({ key: ['movie'] }),
      'records:GAME': () => queryCache.invalidateQueries({ key: ['games'] }),
    },
  })

  async function connect() {
    try {
      const { io } = await import('socket.io-client')

      socket.value = io(`${window.location.protocol}//${window.location.host}`, {
        transports: ['websocket'],
      })
        .on('connect', () => {
          isConnected.value = true
        })
        .on('disconnect', () => {
          isConnected.value = false
        })
        .on('update-records', (payload?: { genre?: string }) => {
          coalescer.enqueue('stats')
          if (payload?.genre) {
            coalescer.enqueue('records:' + payload.genre)
          } else {
            coalescer.enqueue('records:ANIME')
            coalescer.enqueue('records:CARTOON')
            coalescer.enqueue('records:SERIES')
            coalescer.enqueue('records:MOVIE')
            coalescer.enqueue('records:GAME')
          }
        })
        .on('update-likes', () => {
          coalescer.enqueue('suggestions')
        })
        .on('update-queue', () => {
          coalescer.enqueue('suggestions')
          coalescer.enqueue('stats')
        })
        .on('update-suggestions', () => {
          coalescer.enqueue('suggestions')
        })
        .on('update-users', () => {
          coalescer.enqueue('user')
          coalescer.enqueue('wordle')
        })
        .on('update-wordle', () => {
          coalescer.enqueue('wordle')
        })
        .on('connect_error', (error) => {
          console.error('WebSocket connection error:', error)
          isConnected.value = false
        })
    } catch (error) {
      console.error('WebSocket connection error:', error)
      isConnected.value = false
    }
  }

  function disconnect() {
    coalescer.cancel()
    socket.value?.disconnect()
    socket.value = null
  }

  onMounted(() => {
    void connect()
  })
  onUnmounted(() => disconnect())

  return {
    socket,
    isConnected,
    connect,
    disconnect,
  }
}
