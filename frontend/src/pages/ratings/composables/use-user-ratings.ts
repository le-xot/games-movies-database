import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useApi } from '@/stores/use-api'
import { useTitle } from '@/stores/use-title'
import { useUser } from '@/stores/use-user'
import { parseApiError } from '@/utils/api-error'
import type { RecordGrade, RecordUpdateDTO } from '@/lib/api'

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
  const page = ref(1)
  const gradeFilter = ref<RecordGrade[] | null>(null)

  async function fetchRatings() {
    if (!profileUserId.value) return { items: [], total: 0 }
    error.value = null
    try {
      const params = {
        page: page.value,
        limit: PAGE_SIZE,
        ...(gradeFilter.value?.length ? { grade: gradeFilter.value } : {}),
      }
      const { data } = isMine.value
        ? await api.ratings.ratingControllerGetMyRatings(params)
        : await api.ratings.ratingControllerGetUserRatings(profileUserId.value, params)
      return data
    } catch (err) {
      error.value = await parseApiError(err, 'Не удалось загрузить оценки')
      throw err
    }
  }

  const {
    data: ratings,
    isLoading,
    refetch: refetchRatings,
  } = useQuery({ key: ['user-ratings'], query: fetchRatings })

  function refetchAll() {
    void refetchRatings()
  }

  watch(profileUserId, () => {
    page.value = 1
    gradeFilter.value = null
    refetchAll()
  })

  const items = computed(() => ratings.value?.items ?? [])
  const total = computed(() => ratings.value?.total ?? 0)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
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
    page.value = 1
    void refetchRatings()
  }

  function nextPage() {
    if (page.value < totalPages.value) {
      page.value += 1
      void refetchRatings()
    }
  }

  function prevPage() {
    if (page.value > 1) {
      page.value -= 1
      void refetchRatings()
    }
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
    totalPages,
    page,
    gradeFilter,
    isLoading,
    error,
    profileLogin,
    setGradeFilter,
    nextPage,
    prevPage,
    updateRecord,
    updatePoster,
    deleteRecord,
    refetch: refetchAll,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserRatings, import.meta.hot))
}
