import { computed, ref, watch } from 'vue'
import { RecordGenre } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'
import type { LikeEntity, RecordEntity } from '@/lib/api'
import type { Ref } from 'vue'

export function useProfile(userId: Ref<string | undefined>) {
  const api = useApi()
  const userStore = useUser()

  const likes = ref<LikeEntity[]>([])
  const suggestions = ref<RecordEntity[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const targetUserId = computed(() => userId.value ?? userStore.user?.id)

  const suggestionsByGenre = computed(() => {
    const result: Partial<Record<RecordGenre, RecordEntity[]>> = {}
    for (const genre of Object.values(RecordGenre)) {
      result[genre] = suggestions.value.filter((r) => r.genre === genre)
    }
    return result
  })

  async function fetchProfileData(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const [likesRes] = await Promise.all([api.likes.likeControllerGetLikesByUserId(id)])
      likes.value = likesRes.data.likes
      suggestions.value = []
    } catch (e: any) {
      if (e?.status === 404 || e?.response?.status === 404) {
        error.value = 'Пользователь не найден'
      } else {
        error.value = 'Ошибка загрузки данных'
      }
      likes.value = []
      suggestions.value = []
    } finally {
      isLoading.value = false
    }
  }

  watch(
    targetUserId,
    (newId) => {
      if (newId) {
        fetchProfileData(newId)
      }
    },
    { immediate: true },
  )

  return {
    likes,
    suggestions,
    isLoading,
    error,
    suggestionsByGenre,
  }
}
