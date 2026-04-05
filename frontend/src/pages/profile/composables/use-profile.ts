import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { ProfileStatsEntity, RecordEntity } from '@/lib/api'
import { RecordGenre } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'

export function useProfile(login: Ref<string | undefined>) {
  const api = useApi()
  const userStore = useUser()

  const records = ref<RecordEntity[]>([])
  const profileStats = ref<ProfileStatsEntity | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const recordsByGenre = computed(() => {
    const result: Partial<Record<RecordGenre, RecordEntity[]>> = {}
    for (const genre of Object.values(RecordGenre)) {
      result[genre] = records.value.filter((r) => r.genre === genre)
    }
    return result
  })

  async function fetchProfileData(targetLogin: string) {
    isLoading.value = true
    error.value = null
    try {
      const [recordsRes, statsRes] = await Promise.all([
        api.users.userControllerGetUserRecords({ login: targetLogin }),
        api.users.userControllerGetUserProfileStats(targetLogin),
      ])
      records.value = recordsRes.data
      profileStats.value = statsRes.data as unknown as ProfileStatsEntity
    } catch (e: any) {
      if (e?.status === 404 || e?.response?.status === 404) {
        error.value = 'Пользователь не найден'
      } else {
        error.value = 'Ошибка загрузки данных'
      }
      records.value = []
      profileStats.value = null
    } finally {
      isLoading.value = false
    }
  }

  watch(
    login,
    (newLogin) => {
      const targetLogin = newLogin ?? userStore.user?.login
      if (targetLogin) {
        fetchProfileData(targetLogin)
      }
    },
    { immediate: true },
  )

  return {
    records,
    profileStats,
    isLoading,
    error,
    recordsByGenre,
  }
}
