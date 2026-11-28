import {
  parseWsMessage,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type WsMessage,
} from '@gmdb/contract'
import { useQueryCache } from '@pinia/colada'
import { onMounted, onUnmounted, ref } from 'vue'
import { createEventCoalescer } from '@/composables/use-event-coalescer'
import {
  createConnectTracker,
  enqueueResync,
  invalidationKeysFor,
  type CoalescerKey,
} from '@/composables/websocket-resync'
import { buildWsHandlers } from '@/composables/ws-handlers'
import { useUser } from '@/stores/use-user'

/** Первая пауза перед переподключением и её потолок. */
const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30_000

export function useWebSocket() {
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const queryCache = useQueryCache()
  const userStore = useUser()

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempt = 0
  let stopped = false

  const handlers = buildWsHandlers({
    invalidate: (key) => {
      void queryCache.invalidateQueries({ key })
    },
    refetchUser: () => userStore.refetchUser(),
  })

  const coalescer = createEventCoalescer<CoalescerKey>({ handlers })

  const trackConnect = createConnectTracker(() => enqueueResync(coalescer))

  function socketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

    return `${protocol}//${window.location.host}/ws`
  }

  function scheduleReconnect() {
    if (stopped || reconnectTimer) return

    const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_MAX_MS)
    const jitter = Math.random() * delay * 0.2
    reconnectAttempt += 1

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay + jitter)
  }

  function handleMessage(message: WsMessage) {
    for (const key of invalidationKeysFor(message)) coalescer.enqueue(key)
  }

  function connect() {
    if (stopped) return

    try {
      const client = new WebSocket(socketUrl())
      socket.value = client

      client.onopen = () => {
        isConnected.value = true
        reconnectAttempt = 0
        trackConnect()
      }

      client.onmessage = (event: MessageEvent) => {
        const message = parseWsMessage(event.data)
        if (message) handleMessage(message)
      }

      client.onclose = () => {
        isConnected.value = false
        socket.value = null
        scheduleReconnect()
      }

      client.onerror = () => {
        isConnected.value = false
        console.error('WebSocket connection error')
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
      isConnected.value = false
      scheduleReconnect()
    }
  }

  function disconnect() {
    stopped = true
    coalescer.cancel()

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    socket.value?.close()
    socket.value = null
    isConnected.value = false
  }

  onMounted(() => {
    stopped = false
    connect()
  })
  onUnmounted(() => disconnect())

  return {
    socket,
    isConnected,
    connect,
    disconnect,
  }
}

export type { ClientToServerEvents, ServerToClientEvents }
