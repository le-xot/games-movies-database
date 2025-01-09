import { useTableSearch } from '@/components/table/composables/use-table-search'
import { useApi } from '@/composables/use-api'
import { type PatchVideoDTO, StatusesEnum, type VideoEntity } from '@/lib/api.ts'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed } from 'vue'

export const VIDEOS_QUERY_KEY = 'videos'

export const useVideos = defineStore('videos/use-videos', () => {
  const api = useApi()
  const search = useTableSearch()

  const {
    isLoading,
    data,
    refetch: refetchVideos,
  } = useQuery<VideoEntity[]>({
    key: [VIDEOS_QUERY_KEY],
    query: async () => {
      const { data } = await api.videos.videoControllerGetAllVideos()
      return data
    },
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
    return data.value.filter((video) => {
      return video.status === StatusesEnum.QUEUE
        || video.status === StatusesEnum.PROGRESS
    })
  })

  const videos = computed(() => {
    return search.filterData(data.value ?? [])
  })

  return {
    isLoading,
    videos,
    videosQueue,
    search,
    refetchVideos,
    updateVideo,
    deleteVideo,
    createVideo,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVideos, import.meta.hot))
}
