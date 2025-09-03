import { useQueue } from '@/pages/queue/composables/use-queue'
import { useWebSocket } from './use-websocket'

export function useRealtime() {
  const { socket } = useWebSocket()
  const queueStore = useQueue()

  const setupListeners = () => {
    console.log('setupListeners')
    socket.value?.on('WebSocketUpdate', () => {
      void queueStore.refetch()
    })
  }

  return {
    setupListeners,
  }
}
