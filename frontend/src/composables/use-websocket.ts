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
  const isConnected = ref(false) // Добавлено для отслеживания состояния
  const queueStore = useQueue() // Экземпляр стора
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
        console.log('Connected to websocket')
        isConnected.value = true
      })
      .on('disconnect', () => {
        console.log('Disconnected from websocket')
        isConnected.value = false
      })
      .on('WebSocketUpdate', () => {
        console.log('WebSocketUpdate received')
        queueStore.refetch().then(r => console.log('Queue refetched', r))
        animeStore.refetchVideos().then(r => console.log('Anime refetched', r))
        cartoonStore.refetchVideos().then(r => console.log('Cartoon refetched', r))
        seriesStore.refetchVideos().then(r => console.log('Series refetched', r))
        movieStore.refetchVideos().then(r => console.log('Movie refetched', r))
        gamesStore.refetchGames().then(r => console.log('Games refetched', r))
        suggestionStore.refetchSuggestions().then(r => console.log('Suggestions refetched', r))
        auctionStore.refetchAuctions().then(r => console.log('Auctions refetched', r))
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
