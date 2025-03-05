import { useApi } from '@/composables/use-api'
import { GenresEnum, GetAllVideosResponse, type PatchVideoDTO } from '@/lib/api.ts'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useSeriesParams } from './use-series-params.ts'

export const VIDEOS_QUERY_KEY = 'series'

export const useSeries = defineStore('series/use-series', () => {
  const api = useApi()
  const {
    pagination,
    cartoonParams,
  } = storeToRefs(useSeriesParams())

  const {
    isLoading,
    data,
    refetch: refetchVideos,
  } = useQuery({
    placeholderData(previousData): GetAllVideosResponse {
      if (!previousData) return { videos: [], total: 0 }
      return previousData
    },
    key: () => [VIDEOS_QUERY_KEY, cartoonParams.value],
    query: async () => {
      const { data } = await api.videos.videoControllerGetAllVideos(cartoonParams.value)
      return data
    },
  })

  const totalRecords = computed(() => {
    if (!data.value) return 0
    return data.value.total
  })

  const totalPages = computed(() => {
    if (!data.value) return 0
    return Math.ceil(data.value.total / pagination.value.pageSize)
  })

  const { mutateAsync: updateVideo } = useMutation({
    key: [VIDEOS_QUERY_KEY, 'update'],
    mutation: ({ id, data }: { id: number, data: PatchVideoDTO }) => {
      return api.videos.videoControllerPatchVideo(id, data)
    },
    onSettled: () => refetchVideos(),
  })

  const { mutateAsync: deleteVideo } = useMutation({
    key: [VIDEOS_QUERY_KEY, 'delete'],
    mutation: (id: number) => {
      return api.videos.videoControllerDeleteVideo(id)
    },
    onSettled: () => refetchVideos(),
  })

  const { mutateAsync: createVideo } = useMutation({
    key: [VIDEOS_QUERY_KEY, 'create'],
    mutation: async () => {
      return await api.videos.videoControllerCreateVideo({ genre: GenresEnum.SERIES })
    },
    onSettled: () => refetchVideos(),
  })

  const videos = computed(() => {
    if (!data.value) return []
    return data.value.videos
  })

  return {
    isLoading,
    videos,
    refetchVideos,
    updateVideo,
    deleteVideo,
    createVideo,
    totalRecords,
    totalPages,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSeries, import.meta.hot))
}
