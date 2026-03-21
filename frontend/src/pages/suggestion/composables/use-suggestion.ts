import { acceptHMRUpdate, defineStore } from 'pinia'
import { useSuggestionActions } from './use-suggestion-actions'
import { useSuggestionData } from './use-suggestion-data'
import { useSuggestionDialog } from './use-suggestion-dialog'

/**
 * Main suggestion composable that combines data, actions, and dialog management
 * 
 * Split into three separate stores for better separation of concerns:
 * - use-suggestion-data: Data fetching and state management
 * - use-suggestion-actions: CRUD operations with error handling
 * - use-suggestion-dialog: Dialog management
 */
export const useSuggestion = defineStore('queue/use-suggestion', () => {
  const data = useSuggestionData()
  const actions = useSuggestionActions()
  const dialog = useSuggestionDialog()

  return {
    // Data
    isLoading: data.isLoading,
    error: data.error,
    suggestions: data.suggestions,
    refetchSuggestions: data.refetchSuggestions,
    
    // Actions
    submitSuggestion: actions.submitSuggestion,
    handlePatchSuggestion: actions.handlePatchSuggestion,
    handleDeleteSuggestion: actions.handleDeleteSuggestion,
    handleDeleteOwnSuggestion: actions.handleDeleteOwnSuggestion,
    handleApproveSuggestion: actions.handleApproveSuggestion,
    handleMoveToAuction: actions.handleMoveToAuction,
    
    // Dialog
    openSuggestionDialog: dialog.openSuggestionDialog,
  }
})

export { SUGGESTION_QUERY_KEY } from './use-suggestion-data'

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSuggestion, import.meta.hot))
}
