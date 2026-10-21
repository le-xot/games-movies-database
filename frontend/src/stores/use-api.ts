import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { Api, HttpClient } from '@/lib/api'

/** Число активных запросов к API — для тонкого индикатора фоновой загрузки. */
export const apiPendingCount = ref(0)

export const useApi = defineStore('global/use-api', () => {
  const httpClient = new HttpClient({
    baseUrl: '/api',
    baseApiParams: {
      credentials: 'include',
    },
    customFetch: (async (...args: Parameters<typeof fetch>) => {
      apiPendingCount.value += 1
      try {
        return await fetch(...args)
      } finally {
        apiPendingCount.value -= 1
      }
    }) as typeof fetch,
  })

  return new Api(httpClient)
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useApi, import.meta.hot))
}
