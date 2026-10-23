import { acceptHMRUpdate, defineStore } from 'pinia'
import { api } from '@/lib/api'

export const useApi = defineStore('global/use-api', () => api)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useApi, import.meta.hot))
}
