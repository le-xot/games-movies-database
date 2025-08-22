import { useQueue } from '@/pages/queue/composables/use-queue'
import { UseWebsocket } from './use-websocket'

export function useRealtime() {
  const { socket } = UseWebsocket()
  const queueStore = useQueue()

  const setupListeners = () => {
    socket.value?.on('queueUpdated', () => {
      queueStore.refetch()
    })
  }

  return {
    setupListeners,
  }
}
