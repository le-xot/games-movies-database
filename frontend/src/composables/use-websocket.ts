import { useQueryCache } from '@pinia/colada'
import { onMounted, onUnmounted, ref } from 'vue'
import {
  RECORDS_QUERY_KEYS,
  STATS_QUERY_KEY,
  SUGGESTION_QUERY_KEY,
  WORDLE_LEADERBOARD_KEY,
} from '@/composables/query-keys'
import { createEventCoalescer } from '@/composables/use-event-coalescer'
import {
  RECORD_GENRES,
  createConnectTracker,
  enqueueResync,
  type CoalescerKey,
} from '@/composables/websocket-resync'
import { RecordGenre } from '@/lib/api'
import { useUser } from '@/stores/use-user'
import {
  WsEvents,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@/types/socket-events'
import type { Socket } from 'socket.io-client'

export function useWebSocket() {
  const socket = ref<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const isConnected = ref(false)
  const queryCache = useQueryCache()
  const userStore = useUser()

  const coalescer = createEventCoalescer<CoalescerKey>({
    handlers: {
      suggestions: () => queryCache.invalidateQueries({ key: [SUGGESTION_QUERY_KEY] }),
      stats: () => queryCache.invalidateQueries({ key: [STATS_QUERY_KEY] }),
      user: () => userStore.refetchUser(),
      wordle: () => queryCache.invalidateQueries({ key: [WORDLE_LEADERBOARD_KEY] }),
      'records:ANIME': () =>
        queryCache.invalidateQueries({ key: [RECORDS_QUERY_KEYS[RecordGenre.ANIME]] }),
      'records:CARTOON': () =>
        queryCache.invalidateQueries({ key: [RECORDS_QUERY_KEYS[RecordGenre.CARTOON]] }),
      'records:SERIES': () =>
        queryCache.invalidateQueries({ key: [RECORDS_QUERY_KEYS[RecordGenre.SERIES]] }),
      'records:MOVIE': () =>
        queryCache.invalidateQueries({ key: [RECORDS_QUERY_KEYS[RecordGenre.MOVIE]] }),
      'records:GAME': () =>
        queryCache.invalidateQueries({ key: [RECORDS_QUERY_KEYS[RecordGenre.GAME]] }),
    },
  })

  const trackConnect = createConnectTracker(() => enqueueResync(coalescer))

  async function connect() {
    try {
      const { io } = await import('socket.io-client')

      const client: Socket<ServerToClientEvents, ClientToServerEvents> = io(
        `${window.location.protocol}//${window.location.host}`,
        {
          transports: ['websocket'],
        },
      )

      socket.value = client
        .on('connect', () => {
          isConnected.value = true
          trackConnect()
        })
        .on('disconnect', () => {
          isConnected.value = false
        })
        .on(WsEvents.UPDATE_RECORDS, (payload) => {
          coalescer.enqueue('stats')
          if (payload?.genre) {
            coalescer.enqueue(`records:${payload.genre}`)
          } else {
            for (const genre of RECORD_GENRES) {
              coalescer.enqueue(`records:${genre}`)
            }
          }
        })
        .on(WsEvents.UPDATE_LIKES, () => {
          coalescer.enqueue('suggestions')
        })
        .on(WsEvents.UPDATE_QUEUE, () => {
          coalescer.enqueue('suggestions')
          coalescer.enqueue('stats')
        })
        .on(WsEvents.UPDATE_SUGGESTIONS, () => {
          coalescer.enqueue('suggestions')
        })
        .on(WsEvents.UPDATE_USERS, () => {
          coalescer.enqueue('user')
          coalescer.enqueue('wordle')
        })
        .on(WsEvents.UPDATE_WORDLE, () => {
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
