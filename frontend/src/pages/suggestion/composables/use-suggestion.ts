import { useDialog } from '@/components/dialog/composables/use-dialog'
import { toast } from '@/components/ui/toast'
import { useApi } from '@/composables/use-api'
import { useNewRecords } from '@/composables/use-new-records'
import { RecordEntity, RecordStatus, RecordType } from '@/lib/api'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'

import { computed, ref, watch } from 'vue'
import SuggestionForm from '../components/suggestion-form.vue'
import SupportedServices from '../components/supported-services.vue'

export const SUGGESTION_QUERY_KEY = 'suggestion'
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
      onSubmit: () => { },
      onCancel: () => {
        dialog.closeDialog()
        if (onClose) onClose()
      },
      component: SuggestionForm,
    })
  }

  const {
    isLoading: isLoadingData,
    data: suggestions,
    refetch: refetchSuggestions,
  } = useQuery<RecordEntity[]>({
    key: [SUGGESTION_QUERY_KEY],
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

  watch(() => suggestions.value, (newData) => {
    if (newData) {
      const currentIds = newData.map(record => record.id)
      newRecords.cleanupViewedRecords(currentIds)
    }
  }, { immediate: true })

  const { mutateAsync: submitSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'submit'],
    mutation: async (link: string) => {
      try {
        error.value = null
        return await api.suggestions.suggestionControllerUserSuggest({ link })
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: patchSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await api.records.recordControllerPatchRecord(id, { status: RecordStatus.NOTINTERESTED, type: RecordType.WRITTEN })
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: deleteSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await api.records.recordControllerDeleteRecord(id)
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: approveSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'approve'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await api.records.recordControllerPatchRecord(id, { type: RecordType.WRITTEN })
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: moveToAuction } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'move-to-auction'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await api.records.recordControllerPatchRecord(id, { type: RecordType.AUCTION })
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  const { mutateAsync: deleteOwnSuggestion } = useMutation({
    key: [SUGGESTION_QUERY_KEY, 'delete-own'],
    mutation: async (id: number) => {
      try {
        error.value = null
        return await api.suggestions.suggestionControllerDeleteUserSuggestion(id)
      } catch (err: any) {
        error.value = err.message || 'Неизвестная ошибка'
        throw err
      }
    },
  })

  async function handlePatchSuggestion(id: number) {
    try {
      await patchSuggestion(id)
      toast({ title: 'Успешно', description: 'Совет отмечен как не интересный', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: error.value || 'Не удалось удалить совет', variant: 'destructive' })
    }
  }

  async function handleDeleteSuggestion(id: number) {
    try {
      await deleteSuggestion(id)
      toast({ title: 'Успешно', description: 'Совет удален', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: error.value || 'Не удалось удалить совет', variant: 'destructive' })
    }
  }

  async function handleDeleteOwnSuggestion(id: number) {
    try {
      await deleteOwnSuggestion(id)
      toast({ title: 'Успешно', description: 'Совет удален', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: error.value || 'Не удалось удалить совет', variant: 'destructive' })
    }
  }

  async function handleMoveToAuction(id: number) {
    try {
      await moveToAuction(id)
      toast({ title: 'Успешно', description: 'Совет отправлен на аукцион', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: error.value || 'Не удалось отправить совет на аукцион', variant: 'destructive' })
    }
  }

  async function handleApproveSuggestion(id: number) {
    try {
      await approveSuggestion(id)
      toast({ title: 'Успешно', description: 'Совет одобрен', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: error.value || 'Не удалось одобрить совет', variant: 'destructive' })
    }
  }

  const isLoading = computed(() => isLoadingData.value)

  return {
    isLoading,
    error,
    suggestions,
    refetchSuggestions,
    submitSuggestion,
    handlePatchSuggestion,
    handleDeleteSuggestion,
    handleDeleteOwnSuggestion,
    handleApproveSuggestion,
    handleMoveToAuction,
    openSuggestionDialog,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSuggestion, import.meta.hot))
}
