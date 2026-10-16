import { useInfiniteQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { getNextRatingsPageParam } from '@/pages/ratings/composables/user-ratings-pagination'
import { useApi } from '@/stores/use-api'
import { useTitle } from '@/stores/use-title'
import { useUser } from '@/stores/use-user'
import { parseApiError } from '@/utils/api-error'
import type { GetUserRatingsEntity, RecordGrade, RecordUpdateDTO } from '@/lib/api'

const PAGE_SIZE = 24

export const useUserRatings = defineStore('ratings/use-user-ratings', () => {
  const api = useApi()
  const route = useRoute()
  const userStore = useUser()
  const { updateTitle } = useTitle()
  const error = ref<string | null>(null)

  const isMine = computed(() => route.name === 'my-ratings')
  const profileUserId = computed(() =>
    isMine.value ? (userStore.currentUserId ?? '') : String(route.params.id ?? ''),
  )
  const gradeFilter = ref<RecordGrade[] | null>(null)

  const {
    data,
    isLoading,
    refetch: refetchRatings,
    hasNextPage,
    loadNextPage: loadNextPageRaw,
  } = useInfiniteQuery<GetUserRatingsEntity, Error, number>(() => ({
    key: ['user-ratings', profileUserId.value, gradeFilter.value],
    initialPageParam: 1,
    query: async ({ pageParam }) => {
      error.value = null
      try {
        if (!profileUserId.value) return { items: [], total: 0 }
        const params = {
          page: pageParam,
          limit: PAGE_SIZE,
          ...(gradeFilter.value?.length ? { grade: gradeFilter.value } : {}),
        }
        const { data: response } = isMine.value
          ? await api.ratings.ratingControllerGetMyRatings(params)
          : await api.ratings.ratingControllerGetUserRatings(profileUserId.value, params)
        return response
      } catch (err) {
        error.value = await parseApiError(err, 'Не удалось загрузить оценки')
        throw err
      }
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) =>
      getNextRatingsPageParam(lastPage, allPages, lastPageParam),
  }))

  const isLoadingNext = ref(false)

  async function loadNextPage() {
    if (isLoadingNext.value || !hasNextPage.value) return
    isLoadingNext.value = true
    try {
      await loadNextPageRaw()
    } finally {
      isLoadingNext.value = false
    }
  }

  function refetchAll() {
    void refetchRatings()
  }

  watch(profileUserId, () => {
    gradeFilter.value = null
  })

  const items = computed(() => data.value?.pages.flatMap((page) => page.items) ?? [])
  const total = computed(() => data.value?.pages[data.value.pages.length - 1]?.total ?? 0)
  const profileLogin = computed(() => items.value[0]?.userLogin ?? null)

  watch(
    [isMine, profileLogin],
    ([mine, login]) => {
      updateTitle(mine ? 'Мои оценки' : login ? `Оценки ${login}` : 'Оценки пользователя')
    },
    { immediate: true },
  )

  function setGradeFilter(value: RecordGrade[] | null) {
    gradeFilter.value = value?.length ? value : null
  }

  async function updateRecord(payload: { id: number; data: RecordUpdateDTO }) {
    try {
      await api.records.recordControllerPatchRecord(payload.id, payload.data)
      await refetchRatings()
    } catch {
      toast.error('Не удалось обновить запись')
    }
  }

  async function updatePoster(payload: { id: number; url: string }) {
    try {
      await api.records.recordControllerUpdatePoster(payload.id, { url: payload.url })
      await refetchRatings()
    } catch {
      toast.error('Не удалось обновить постер')
    }
  }

  async function deleteRecord(id: number) {
    try {
      await api.records.recordControllerDeleteRecord(id)
      await refetchRatings()
    } catch {
      toast.error('Не удалось удалить запись')
    }
  }

  return {
    isMine,
    items,
    total,
    hasNextPage,
    isLoadingNext,
    loadNextPage,
    gradeFilter,
    isLoading,
    error,
    profileLogin,
    setGradeFilter,
    updateRecord,
    updatePoster,
    deleteRecord,
    refetch: refetchAll,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserRatings, import.meta.hot))
}
