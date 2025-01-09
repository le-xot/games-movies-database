import { Api, HttpClient } from '@/lib/api.ts'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useApi = defineStore('globals/use-api', () => {
  const httpClient = new HttpClient({
    baseUrl: '/api',
  })
  const api = new Api(httpClient)
  return api
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useApi, import.meta.hot))
}
