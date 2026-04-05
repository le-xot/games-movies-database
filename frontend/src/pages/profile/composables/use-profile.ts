import { computed, ref, watch } from 'vue'
import { RecordGenre } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'
import type { ProfileStatsEntity, RecordEntity } from '@/lib/api'
import type { Ref } from 'vue'

export function useProfile(login: Ref<string | undefined>) {
  const api = useApi()
  const userStore = useUser()

  const records = ref<RecordEntity[]>([])
  const profileStats = ref<ProfileStatsEntity | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const targetLogin = computed(() => login.value ?? userStore.user?.login)

  const recordsByGenre = computed(() => {
    const result: Partial<Record<RecordGenre, RecordEntity[]>> = {}
    for (const genre of Object.values(RecordGenre)) {
      result[genre] = records.value.filter((r) => r.genre === genre)
    }
    return result
  })

  async function fetchProfileData(loginValue: string) {
    isLoading.value = true
    error.value = null
    try {
      const [recordsRes, statsRes] = await Promise.all([
        api.users.userControllerGetUserRecords({ login: loginValue }),
        api.users.userControllerGetUserProfileStats(loginValue),
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
    targetLogin,
    (newLogin) => {
      if (newLogin) {
        fetchProfileData(newLogin)
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
