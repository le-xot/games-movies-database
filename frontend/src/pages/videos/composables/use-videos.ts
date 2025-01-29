import { usePagination } from '@/components/table/composables/use-pagination'
import { useTableSearch } from '@/components/table/composables/use-table-search'
import { useApi } from '@/composables/use-api'
import { type PatchVideoDTO, StatusesEnum, VideoEntity } from '@/lib/api.ts'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed } from 'vue'

export const VIDEOS_QUERY_KEY = 'videos'

export const useVideos = defineStore('videos/use-videos', () => {
  const api = useApi()
  const search = useTableSearch()

  const pagination = usePagination()

  const queryVideos = computed(() => {
    return {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      direction: 'asc',
      orderBy: 'id',
    }
  })

  const setQueryVideos = (newQuery: Partial<typeof queryVideos.value>) => {
    Object.assign(queryVideos.value, newQuery)
  }

  const {
    isLoading,
    data,
    refetch: refetchVideos,
  } = useQuery<{ videos: VideoEntity[], total: number }>({
    key: () => [VIDEOS_QUERY_KEY, queryVideos.value],
    query: async () => {
      const { data } = await api.videos.videoControllerGetAllVideos(queryVideos.value)
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
    onSuccess: () => refetchVideos(),
  })

  const { mutateAsync: deleteVideo } = useMutation({
    key: [VIDEOS_QUERY_KEY, 'delete'],
    mutation: (id: number) => {
      return api.videos.videoControllerDeleteVideo(id)
    },
    onSuccess: () => refetchVideos(),
  })

  const { mutateAsync: createVideo } = useMutation({
    key: [VIDEOS_QUERY_KEY, 'create'],
    mutation: async () => {
      return await api.videos.videoControllerCreateVideo({})
    },
    onSuccess: () => refetchVideos(),
  })

  const videosQueue = computed(() => {
    if (!data.value) return []

    return data.value.videos.filter((video) => {
      return video.status === StatusesEnum.QUEUE
        || video.status === StatusesEnum.PROGRESS
    })
  })

  const videos = computed(() => {
    return search.filterData(data.value?.videos ?? [])
  })

  return {
    setQueryVideos,
    isLoading,
    videos,
    videosQueue,
    search,
    refetchVideos,
    updateVideo,
    deleteVideo,
    createVideo,
    pagination,
    totalRecords,
    totalPages,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVideos, import.meta.hot))
}
