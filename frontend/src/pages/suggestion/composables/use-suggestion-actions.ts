import { useApi } from '@/composables/use-api'
import { RecordStatus, RecordType } from '@/lib/api'
import { createErrorHandler } from '@/utils/error-handler'
import { useMutation } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { SUGGESTION_QUERY_KEY } from './use-suggestion-data'

export const useSuggestionActions = defineStore('suggestion/use-suggestion-actions', () => {
  const api = useApi()
  const { error, handleAsync } = createErrorHandler()

  const { mutateAsync: submitSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'submit'],
    mutation: async (link: string) => {
      return await api.suggestions.suggestionControllerUserSuggest({ link })
    },
  })

  const { mutateAsync: patchSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'patch'],
    mutation: async (id: number) => {
      return await api.records.recordControllerPatchRecord(id, {
        status: RecordStatus.NOTINTERESTED,
        type: RecordType.WRITTEN
      })
    },
  })

  const { mutateAsync: deleteSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete'],
    mutation: async (id: number) => {
      return await api.records.recordControllerDeleteRecord(id)
    },
  })

  const { mutateAsync: approveSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'approve'],
    mutation: async (id: number) => {
      return await api.records.recordControllerPatchRecord(id, { type: RecordType.WRITTEN })
    },
  })

  const { mutateAsync: moveToAuction } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'move-to-auction'],
    mutation: async (id: number) => {
      return await api.records.recordControllerPatchRecord(id, { type: RecordType.AUCTION })
    },
  })

  const { mutateAsync: deleteOwnSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete-own'],
    mutation: async (id: number) => {
      return await api.suggestions.suggestionControllerDeleteUserSuggestion(id)
    },
  })

  // Handler functions with error handling and toast notifications
  async function handlePatchSuggestion(id: number) {
    return handleAsync(
      () => patchSuggestion(id),
      { title: 'Успешно', description: 'Совет отмечен как не интересный' },
      { title: 'Ошибка', description: 'Не удалось отметить совет' }
    )
  }

  async function handleDeleteSuggestion(id: number) {
    return handleAsync(
      () => deleteSuggestion(id),
      { title: 'Успешно', description: 'Совет удален' },
      { title: 'Ошибка', description: 'Не удалось удалить совет' }
    )
  }

  async function handleDeleteOwnSuggestion(id: number) {
    return handleAsync(
      () => deleteOwnSuggestion(id),
      { title: 'Успешно', description: 'Совет удален' },
      { title: 'Ошибка', description: 'Не удалось удалить совет' }
    )
  }

  async function handleMoveToAuction(id: number) {
    return handleAsync(
      () => moveToAuction(id),
      { title: 'Успешно', description: 'Совет отправлен на аукцион' },
      { title: 'Ошибка', description: 'Не удалось отправить совет на аукцион' }
    )
  }

  async function handleApproveSuggestion(id: number) {
    return handleAsync(
      () => approveSuggestion(id),
      { title: 'Успешно', description: 'Совет одобрен' },
      { title: 'Ошибка', description: 'Не удалось одобрить совет' }
    )
  }

  return {
    error,
    submitSuggestion,
    handlePatchSuggestion,
    handleDeleteSuggestion,
    handleDeleteOwnSuggestion,
    handleApproveSuggestion,
    handleMoveToAuction,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSuggestionActions, import.meta.hot))
}
