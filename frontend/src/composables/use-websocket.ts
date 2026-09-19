import { useQueryCache } from '@pinia/colada'
import { io } from 'socket.io-client'
import { onMounted, onUnmounted, ref } from 'vue'
import { createEventCoalescer } from '@/composables/use-event-coalescer'
import { STATS_QUERY_KEY } from '@/pages/stats/composables/use-stats'
import { SUGGESTION_QUERY_KEY } from '@/pages/suggestion/composables/use-suggestion'
import { useUser } from '@/stores/use-user'

export function useWebSocket() {
  const socket = ref<ReturnType<typeof io> | null>(null)
  const isConnected = ref(false)
  const queryCache = useQueryCache()
  const userStore = useUser()

  const coalescer = createEventCoalescer({
    handlers: {
      suggestions: () => queryCache.invalidateQueries({ key: [SUGGESTION_QUERY_KEY] }),
      stats: () => queryCache.invalidateQueries({ key: [STATS_QUERY_KEY] }),
      user: () => userStore.refetchUser(),
      'records:ANIME': () => queryCache.invalidateQueries({ key: ['anime'] }),
      'records:CARTOON': () => queryCache.invalidateQueries({ key: ['cartoon'] }),
      'records:SERIES': () => queryCache.invalidateQueries({ key: ['series'] }),
      'records:MOVIE': () => queryCache.invalidateQueries({ key: ['movie'] }),
      'records:GAME': () => queryCache.invalidateQueries({ key: ['games'] }),
    },
  })

  function connect() {
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
      })
      .on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        isConnected.value = false
      })
  }

  function disconnect() {
    coalescer.cancel()
    socket.value?.disconnect()
    socket.value = null
  }

  onMounted(() => connect())
  onUnmounted(() => disconnect())

  return {
    socket,
    isConnected,
    connect,
    disconnect,
  }
}
