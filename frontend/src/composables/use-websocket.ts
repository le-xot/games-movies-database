import { io } from 'socket.io-client';
import { onMounted, onUnmounted, ref } from 'vue';
import { useUser } from '@/stores/use-user';
import { RecordGenre } from '@/lib/api';
import { useAnime } from '@/pages/anime/composables/use-anime';
import { useAuctions } from '@/pages/auction/composables/use-auctions';
import { useCartoon } from '@/pages/cartoon/composables/use-cartoon';
import { useGames } from '@/pages/games/composables/use-games';
import { useMovie } from '@/pages/movie/composables/use-movie';
import { useQueue } from '@/pages/queue/composables/use-queue';
import { useSeries } from '@/pages/series/composables/use-series';
import { useSuggestion } from '@/pages/suggestion/composables/use-suggestion';

export function useWebSocket() {
  const socket = ref<ReturnType<typeof io> | null>(null);
  const isConnected = ref(false);
  const queueStore = useQueue();
  const animeStore = useAnime();
  const cartoonStore = useCartoon();
  const seriesStore = useSeries();
  const movieStore = useMovie();
  const gamesStore = useGames();
  const suggestionStore = useSuggestion();
  const auctionStore = useAuctions();
  const userStore = useUser();

  function connect() {
    socket.value = io(`${window.location.protocol}//${window.location.host}`, {
      transports: ['websocket'],
    })
      .on('connect', () => {
        isConnected.value = true;
      })
      .on('disconnect', () => {
        isConnected.value = false;
      })

      .on('update-auction', () => {
        suggestionStore.refetchSuggestions();
        if (userStore.isAdmin) {
          auctionStore.refetchAuctions();
        }
      })
      .on('update-records', (payload: { genre: RecordGenre }) => {
        switch (payload.genre) {
          case 'ANIME':
            animeStore.refetchVideos();
            break;
          case 'CARTOON':
            cartoonStore.refetchVideos();
            break;
          case 'SERIES':
            seriesStore.refetchVideos();
            break;
          case 'MOVIE':
            movieStore.refetchVideos();
            break;
          case 'GAME':
            gamesStore.refetchGames();
            break;
          default:
            animeStore.refetchVideos();
            cartoonStore.refetchVideos();
            seriesStore.refetchVideos();
            movieStore.refetchVideos();
            gamesStore.refetchGames();
            break;
        }
      })
      .on('update-likes', () => {
        suggestionStore.refetchSuggestions();
      })
      .on('update-queue', () => {
        queueStore.refetchQueue();
      })
      .on('update-suggestions', () => {
        suggestionStore.refetchSuggestions();
      })
      .on('update-users', () => {
        const userStore = useUser();
        userStore.refetchUser();
      })
      .on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        isConnected.value = false;
      });
  }

  function disconnect() {
    socket.value?.disconnect();
    socket.value = null;
  }

  onMounted(() => connect());
  onUnmounted(() => disconnect());

  return {
    socket,
    isConnected,
    connect,
    disconnect,
  };
}
