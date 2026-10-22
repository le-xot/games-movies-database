import { useMutation } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useApi } from '@/stores/use-api'

export const LIKE_QUERY_KEY = 'like'
export const useLike = defineStore('queue/use-like', () => {
  const api = useApi()

  const { mutateAsync: deleteLike } = useMutation({
    key: [LIKE_QUERY_KEY, 'delete'],
    mutation: async (recordId: number) => {
      return await api.DELETE('/likes/{recordId}', { params: { path: { recordId } } })
    },
  })

  const { mutateAsync: createLike } = useMutation({
    key: [LIKE_QUERY_KEY, 'create'],
    mutation: async (recordId: number) => {
      return await api.POST('/likes', { body: { recordId } })
    },
  })

  return {
    createLike,
    deleteLike,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLike, import.meta.hot))
}
