import { defineStore } from 'pinia'
import { ref } from 'vue'

interface DialogState {
  title: string
  description: string
  onSubmit: (formData?: any) => void
  onCancel?: () => void
  content?: string
  formData?: { title: string, description: string }
  component?: any
  props?: Record<string, any>
}

export const useDialog = defineStore('dialog', () => {
  const isOpen = ref(false)
  const dialogState = ref<DialogState | null>(null)

  function openDialog(state: DialogState) {
    isOpen.value = true
    dialogState.value = state
  }

  function submitDialog(formData?: any) {
    if (!dialogState.value) return
    dialogState.value.onSubmit(formData)
    isOpen.value = false
    dialogState.value = null
  }

  function closeDialog() {
    isOpen.value = false
    dialogState.value = null
  }

  return {
    isOpen,
    dialogState,
    openDialog,
    submitDialog,
    closeDialog,
  }
})
