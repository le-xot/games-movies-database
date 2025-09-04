import { useAnime } from '@/pages/anime/composables/use-anime.ts'
import { useAuctions } from '@/pages/auction/composables/use-autions.ts'
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon.ts'
import { useGames } from '@/pages/games/composables/use-games.ts'
import { useMovie } from '@/pages/movie/composables/use-movie.ts'
import { useQueue } from '@/pages/queue/composables/use-queue.ts'
import { useSeries } from '@/pages/series/composables/use-series.ts'
import { useSuggestion } from '@/pages/suggestion/composables/use-suggestion.ts'
import { io, Socket } from 'socket.io-client'
import { onMounted, onUnmounted, ref } from 'vue'

export function useWebSocket() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const queueStore = useQueue()
  const animeStore = useAnime()
  const cartoonStore = useCartoon()
  const seriesStore = useSeries()
  const movieStore = useMovie()
  const gamesStore = useGames()
  const suggestionStore = useSuggestion()
  const auctionStore = useAuctions()

  function connect() {
    socket.value = io(`${window.location.protocol}//${window.location.host}`, { transports: ['websocket'] })
      .on('connect', () => {
        isConnected.value = true
      })
      .on('disconnect', () => {
        isConnected.value = false
      })
      .on('WebSocketUpdate', () => {
        queueStore.refetch()
        animeStore.refetchVideos()
        cartoonStore.refetchVideos()
        seriesStore.refetchVideos()
        movieStore.refetchVideos()
        gamesStore.refetchGames()
        suggestionStore.refetchSuggestions()
        auctionStore.refetchAuctions()
      })
      .on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        isConnected.value = false
      })
  }

  function disconnect() {
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
