import { io, Socket } from 'socket.io-client'
import { onMounted, onUnmounted, ref } from 'vue'

export function useWebSocket() {
  const socket = ref<Socket | null>(null)
  onMounted(() => connect())
  onUnmounted(() => disconnect())

  function connect() {
    socket.value = io(`${window.location.protocol}//${window.location.host}`, { transports: ['websocket'] })
      .connect()
      .on('connect', () => {
        console.log('Connected to websocket')
      })
      .on('disconnect', () => {
        console.log('Disconnected from websocket')
      })
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
  }

  return {
    socket,
    connect,
    disconnect,
  }
}
