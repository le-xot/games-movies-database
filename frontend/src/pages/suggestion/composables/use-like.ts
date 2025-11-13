import { toast } from '@/components/ui/toast'
import { useApi } from '@/composables/use-api.ts'
import { useMutation } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const LIKE_QUERY_KEY = 'like'
export const useLike = defineStore('queue/use-like', () => {
  const api = useApi()
  const error = ref<string | null>(null)

  const { mutateAsync: deleteLike } = useMutation({
    key: [LIKE_QUERY_KEY, 'delete'],
    mutation: async (recordId: number) => {
      try {
        error.value = null
        return await api.likes.likeControllerDeleteLike(recordId)
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: createLike } = useMutation({
    key: [LIKE_QUERY_KEY, 'create'],
    mutation: async (recordId: number) => {
      try {
        error.value = null
        return await api.likes.likeControllerCreateLike({ recordId })
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: getLikesByRecordId } = useMutation({
    key: [LIKE_QUERY_KEY, 'getByRecordId'],
    mutation: async (recordId: number) => {
      try {
        error.value = null
        return await api.likes.likeControllerGetLikesByRecordId(recordId)
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: getLikesByUserId } = useMutation({
    key: [LIKE_QUERY_KEY, 'getByUserId'],
    mutation: async (userId: string) => {
      try {
        error.value = null
        return await api.likes.likeControllerGetLikesByUserId(userId)
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: getLikes } = useMutation({
    key: [LIKE_QUERY_KEY, 'get'],
    mutation: async () => {
      try {
        error.value = null
        return await api.likes.likeControllerGetLikes()
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  async function handleGetLikesByRecordId(id: number) {
    try {
      await getLikesByRecordId(id)
      toast({ title: 'Успешно', description: '123', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: error.value || '123', variant: 'destructive' })
    }
  }

  async function handleGetLikesByUserId(id: string) {
    try {
      await getLikesByUserId(id)
      toast({ title: 'Успешно', description: '123', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: error.value || '123', variant: 'destructive' })
    }
  }

  async function handleGetLikes() {
    try {
      await getLikes()
      toast({ title: 'Успешно', description: '123', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: error.value || '123', variant: 'destructive' })
    }
  }

  return {
    createLike,
    deleteLike,
    handleGetLikesByRecordId,
    handleGetLikesByUserId,
    handleGetLikes,
    getLikes,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLike, import.meta.hot))
}
