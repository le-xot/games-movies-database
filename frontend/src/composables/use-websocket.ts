import { io } from 'socket.io-client'
import { onMounted, onUnmounted, ref } from 'vue'
import { createEventCoalescer } from '@/composables/use-event-coalescer'
import { useAnime } from '@/pages/anime/composables/use-anime'
import { useAuctions } from '@/pages/auction/composables/use-auctions'
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon'
import { useGames } from '@/pages/games/composables/use-games'
import { useMovie } from '@/pages/movie/composables/use-movie'
import { useQueue } from '@/pages/queue/composables/use-queue'
import { useSeries } from '@/pages/series/composables/use-series'
import { useSuggestion } from '@/pages/suggestion/composables/use-suggestion'
import { useUser } from '@/stores/use-user'

export function useWebSocket() {
  const socket = ref<ReturnType<typeof io> | null>(null)
  const isConnected = ref(false)
  const queueStore = useQueue()
  const animeStore = useAnime()
  const cartoonStore = useCartoon()
  const seriesStore = useSeries()
  const movieStore = useMovie()
  const gamesStore = useGames()
  const suggestionStore = useSuggestion()
  const auctionStore = useAuctions()
  const userStore = useUser()

  const coalescer = createEventCoalescer({
    handlers: {
      suggestions: () => suggestionStore.refetchSuggestions(),
      queue: () => queueStore.refetchQueue(),
      auction: () => {
        if (userStore.isAdmin) auctionStore.refetchAuctions()
      },
      user: () => userStore.refetchUser(),
      'records:ANIME': () => animeStore.refetchVideos(),
      'records:CARTOON': () => cartoonStore.refetchVideos(),
      'records:SERIES': () => seriesStore.refetchVideos(),
      'records:MOVIE': () => movieStore.refetchVideos(),
      'records:GAME': () => gamesStore.refetchGames(),
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
      .on('update-auction', () => {
        coalescer.enqueue('suggestions')
        coalescer.enqueue('auction')
      })
      .on('update-records', (payload?: { genre?: string }) => {
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
        coalescer.enqueue('queue')
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
