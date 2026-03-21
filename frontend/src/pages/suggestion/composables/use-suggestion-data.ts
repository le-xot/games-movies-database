import { useApi } from '@/composables/use-api'
import { useNewRecords } from '@/composables/use-new-records'
import { RecordEntity } from '@/lib/api'
import { createErrorHandler } from '@/utils/error-handler'
import { useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, watch } from 'vue'

export const SUGGESTION_QUERY_KEY = 'suggestion'

export const useSuggestionData = defineStore('suggestion/use-suggestion-data', () => {
  const api = useApi()
  const newRecords = useNewRecords()
  const { error } = createErrorHandler()

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

  // Cleanup viewed records when suggestions change
  watch(() => suggestions.value, (newData) => {
    if (newData) {
      const currentIds = newData.map(record => record.id)
      newRecords.cleanupViewedRecords(currentIds)
    }
  }, { immediate: true })

  const isLoading = computed(() => isLoadingData.value)

  return {
    isLoading,
    error,
    suggestions,
    refetchSuggestions,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSuggestionData, import.meta.hot))
}
