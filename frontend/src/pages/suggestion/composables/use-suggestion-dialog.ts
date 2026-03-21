import { useDialog } from '@/components/dialog/composables/use-dialog'
import { acceptHMRUpdate, defineStore } from 'pinia'
import SuggestionForm from '../components/suggestion-form.vue'
import SupportedServices from '../components/supported-services.vue'

export const useSuggestionDialog = defineStore('suggestion/use-suggestion-dialog', () => {
  const dialog = useDialog()

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

  return {
    openSuggestionDialog,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSuggestionDialog, import.meta.hot))
}
