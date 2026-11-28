import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRecordMutations } from '@/composables/factories/record-mutations'
import { RECORDS_PAGE_SIZE, useRecordsList } from '@/composables/factories/records-list'
import { USER_RATINGS_QUERY_KEY } from '@/composables/query-keys'
import { unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { useTitle } from '@/stores/use-title'
import { useUser } from '@/stores/use-user'
import type { RecordGrade } from '@/lib/api'

export const useUserRatings = defineStore('ratings/use-user-ratings', () => {
  const api = useApi()
  const route = useRoute()
  const userStore = useUser()
  const { updateTitle } = useTitle()

  const isMine = computed(() => route.name === 'my-ratings')
  const profileUserId = computed(() =>
    isMine.value ? (userStore.currentUserId ?? '') : String(route.params.id ?? ''),
  )
  const gradeFilter = ref<RecordGrade[] | null>(null)

  // Тот же список, что и у жанров: отличается только запрос.
  const list = useRecordsList(() => ({
    key: [USER_RATINGS_QUERY_KEY, profileUserId.value, gradeFilter.value],
    pageSize: RECORDS_PAGE_SIZE,
    errorMessage: 'Не удалось загрузить оценки',
    fetchPage: async (page, limit) => {
      if (!profileUserId.value) return { items: [], total: 0 }

      const params = {
        page,
        limit,
        ...(gradeFilter.value?.length ? { grade: gradeFilter.value } : {}),
      }

      return isMine.value
        ? await unwrap(api.ratings.my.get({ query: params }))
        : await unwrap(api.ratings.users({ id: profileUserId.value }).get({ query: params }))
    },
  }))

  const mutations = useRecordMutations({
    onChanged: () => list.retry(),
    messages: {
      update: 'Не удалось обновить запись',
      poster: 'Не удалось обновить постер',
      delete: 'Не удалось удалить запись',
    },
  })

  watch(profileUserId, () => {
    gradeFilter.value = null
  })

  const profileLogin = computed(() => list.items.value[0]?.userLogin ?? null)

  const isRatingsRoute = computed(
    () => route.name === 'my-ratings' || route.name === 'user-ratings',
  )

  watch(
    [isMine, profileLogin, isRatingsRoute],
    ([mine, login, onRatingsRoute]) => {
      // Стор живёт после ухода со страницы: без этого заголовок оценок
      // перетирал бы `meta.title` любой другой страницы.
      if (!onRatingsRoute) return

      updateTitle(mine ? 'Мои оценки' : login ? `Оценки ${login}` : 'Оценки пользователя')
    },
    { immediate: true },
  )

  function setGradeFilter(value: RecordGrade[] | null) {
    gradeFilter.value = value?.length ? value : null
  }

  return {
    isMine,
    items: list.items,
    total: list.total,
    hasNextPage: list.hasNextPage,
    isLoadingNext: list.isLoadingNext,
    loadNextPage: list.loadNextPage,
    gradeFilter,
    isLoading: list.isLoading,
    error: list.error,
    profileLogin,
    setGradeFilter,
    ...mutations,
    refetch: () => list.retry(),
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserRatings, import.meta.hot))
}
