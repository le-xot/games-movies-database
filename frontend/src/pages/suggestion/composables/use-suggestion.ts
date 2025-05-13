import { useDialog } from '@/components/dialog/composables/use-dialog'
import { useApi } from '@/composables/use-api'
import { RecordEntity, RecordType } from '@/lib/api'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import SuggestionForm from '../components/suggestion-form.vue'

export const SUGGESTION_QUERY_KEY = 'suggestion'
export interface SuggestionError {
  code: string
  message: string
}

export const useSuggestion = defineStore('queue/use-suggestion', () => {
  const api = useApi()
  const error = ref<string | null>(null)
  const dialog = useDialog()

  function openSuggestionDialog(onClose?: () => void) {
    dialog.openDialog({
      title: 'Посоветовать контент',
      description: 'Поддерживаемые форматы:<br/><br/>https://shikimori.one/animes/1943-paprika<br/>https://www.kinopoisk.ru/film/258687<br/>https://www.igdb.com/games/terraria',
      onSubmit: () => {},
      onCancel: () => {
        dialog.closeDialog()
        if (onClose) onClose()
      },
      component: SuggestionForm,
    })
  }

  const {
    isLoading: isLoadingData,
    data,
    refetch: refetchSuggestions,
  } = useQuery({
    key: () => [SUGGESTION_QUERY_KEY],
    query: async () => {
      try {
        error.value = null
        const { data } = await api.suggestions.suggestionControllerGetSuggestions()
        return data
      } catch (err: any) {
        error.value = err.message || 'Failed to load suggestions'
        throw err
      }
    },
  })

  const { mutateAsync: submitSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'submit'],
    mutation: async (link: string) => {
      try {
        error.value = null
        return await api.suggestions.suggestionControllerUserSuggest({ link })
      } catch (err: any) {
        let errorMessage = 'Неизвестная ошибка'

        try {
          if (err instanceof Response || (err && typeof err.json === 'function')) {
            const errorData = await err.clone().json()
            errorMessage = errorData.message || errorMessage
          } else if (err.error) {
            errorMessage = err.error.message || errorMessage
          } else if (err.message) {
            errorMessage = err.message
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }

        error.value = errorMessage
        throw err
      }
    },
    onSettled: () => refetchSuggestions(),
  })

  const { mutateAsync: deleteSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await api.records.recordControllerDeleteRecord(id)
      } catch (err: any) {
        let errorMessage = 'Неизвестная ошибка'

        try {
          if (err instanceof Response || (err && typeof err.json === 'function')) {
            const errorData = await err.clone().json()
            errorMessage = errorData.message || errorMessage
          } else if (err.error) {
            errorMessage = err.error.message || errorMessage
          } else if (err.message) {
            errorMessage = err.message
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }

        error.value = errorMessage
        throw err
      }
    },
    onSettled: () => refetchSuggestions(),
  })

  const { mutateAsync: approveSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'approve'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await api.records.recordControllerPatchRecord(id, { type: RecordType.WRITTEN })
      } catch (err: any) {
        let errorMessage = 'Неизвестная ошибка'

        try {
          if (err instanceof Response || (err && typeof err.json === 'function')) {
            const errorData = await err.clone().json()
            errorMessage = errorData.message || errorMessage
          } else if (err.error) {
            errorMessage = err.error.message || errorMessage
          } else if (err.message) {
            errorMessage = err.message
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }

        error.value = errorMessage
        throw err
      }
    },
    onSettled: () => refetchSuggestions(),
  })

  const { mutateAsync: moveToAuction } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'approve'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await api.records.recordControllerPatchRecord(id, { type: RecordType.AUCTION })
      } catch (err: any) {
        let errorMessage = 'Неизвестная ошибка'

        try {
          if (err instanceof Response || (err && typeof err.json === 'function')) {
            const errorData = await err.clone().json()
            errorMessage = errorData.message || errorMessage
          } else if (err.error) {
            errorMessage = err.error.message || errorMessage
          } else if (err.message) {
            errorMessage = err.message
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }

        error.value = errorMessage
        throw err
      }
    },
    onSettled: () => refetchSuggestions(),
  })

  const suggestions = computed<RecordEntity[]>(() => {
    if (!data.value) return []
    return data.value
  })

  const isLoading = computed(() => isLoadingData.value)

  return {
    isLoading,
    error,
    suggestions,
    refetchSuggestions,
    submitSuggestion,
    deleteSuggestion,
    approveSuggestion,
    moveToAuction,
    openSuggestionDialog,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSuggestion, import.meta.hot))
}
