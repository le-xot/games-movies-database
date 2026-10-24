import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { SUGGESTION_QUERY_KEY } from '@/composables/query-keys'
import { RecordEntity, RecordStatus, RecordType, unwrap } from '@/lib/api'
import { assertOk } from '@/lib/api'
import SuggestionForm from '@/pages/suggestion/components/SuggestionForm.vue'
import SupportedServices from '@/pages/suggestion/components/SupportedServices.vue'
import { useApi } from '@/stores/use-api'
import { useNewRecords } from '@/stores/use-new-records'
import { parseApiError } from '@/utils/api-error'

export const useSuggestion = defineStore('queue/use-suggestion', () => {
  const api = useApi()
  const error = ref<string | null>(null)
  const dialog = useDialog()
  const newRecords = useNewRecords()

  function openSuggestionDialog(onClose?: () => void) {
    dialog.openDialog({
      title: 'Поддерживаемые сервисы',
      description: undefined,
      customContent: SupportedServices,
      onSubmit: () => {},
      onCancel: () => {
        dialog.closeDialog()
        if (onClose) onClose()
      },
      component: SuggestionForm,
    })
  }

  const {
    data: suggestions,
    isLoading,
    refetch: refetchSuggestions,
  } = useQuery<RecordEntity[]>({
    key: [SUGGESTION_QUERY_KEY],
    // Фоновые обновления (WS/refetch) не должны гасить уже отрисованный список.
    placeholderData: (previous) => previous,
    query: async () => {
      try {
        error.value = null
        const data = await unwrap(api.suggestions.get())
        return data
      } catch (err) {
        error.value = await parseApiError(err, 'Failed to load suggestions')
        throw err
      }
    },
  })

  watch(
    () => suggestions.value,
    (newData) => {
      if (newData) {
        const currentIds = newData.map((record) => record.id)
        newRecords.cleanupViewedRecords(currentIds)
      }
    },
    { immediate: true },
  )

  const { mutateAsync: submitSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'submit'],
    mutation: async (link: string) => {
      try {
        error.value = null
        return await assertOk(api.suggestions.post({ link }))
      } catch (err) {
        error.value = await parseApiError(err, 'Неизвестная ошибка')
        throw err
      }
    },
  })

  const { mutateAsync: patchSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await assertOk(
          api.records({ id }).patch({
            status: RecordStatus.NOTINTERESTED,
            type: RecordType.WRITTEN,
          }),
        )
      } catch (err) {
        error.value = await parseApiError(err, 'Неизвестная ошибка')
        throw err
      }
    },
  })

  const { mutateAsync: deleteSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await assertOk(api.records({ id }).delete())
      } catch (err) {
        error.value = await parseApiError(err, 'Неизвестная ошибка')
        throw err
      }
    },
  })

  const { mutateAsync: approveSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'approve'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await assertOk(api.records({ id }).patch({ type: RecordType.WRITTEN }))
      } catch (err) {
        error.value = await parseApiError(err, 'Неизвестная ошибка')
        throw err
      }
    },
  })

  const { mutateAsync: deleteOwnSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete-own'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await assertOk(api.suggestions({ id }).delete())
      } catch (err) {
        error.value = await parseApiError(err, 'Неизвестная ошибка')
        throw err
      }
    },
  })

  async function handlePatchSuggestion(id: number) {
    try {
      await patchSuggestion(id)
      toast('Успешно', { description: 'Совет отмечен как не интересный' })
    } catch {
      toast.error('Ошибка', { description: error.value || 'Не удалось удалить совет' })
    }
  }

  async function handleDeleteSuggestion(id: number) {
    try {
      await deleteSuggestion(id)
      toast('Успешно', { description: 'Совет удален' })
    } catch {
      toast.error('Ошибка', { description: error.value || 'Не удалось удалить совет' })
    }
  }

  async function handleDeleteOwnSuggestion(id: number) {
    try {
      await deleteOwnSuggestion(id)
      toast('Успешно', { description: 'Совет удален' })
    } catch {
      toast.error('Ошибка', { description: error.value || 'Не удалось удалить совет' })
    }
  }

  async function handleApproveSuggestion(id: number) {
    try {
      await approveSuggestion(id)
      toast('Успешно', { description: 'Совет одобрен' })
    } catch {
      toast.error('Ошибка', { description: error.value || 'Не удалось одобрить совет' })
    }
  }

  return {
    error,
    suggestions,
    isLoading,
    refetchSuggestions,
    submitSuggestion,
    handlePatchSuggestion,
    handleDeleteSuggestion,
    handleDeleteOwnSuggestion,
    handleApproveSuggestion,
    openSuggestionDialog,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSuggestion, import.meta.hot))
}
