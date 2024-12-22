import { defineStore } from 'pinia'
import { ref } from 'vue'

interface DialogState {
  title: string
  description: string
  onSubmit: () => void
}

export const useDialog = defineStore('dialog', () => {
  const isOpen = ref(false)
  const dialogState = ref<DialogState | null>(null)

  function openDialog(state: DialogState) {
    isOpen.value = true
    dialogState.value = state
  }

  function submitDialog() {
    if (!dialogState.value) return
    dialogState.value.onSubmit()
    dialogState.value = null
  }

  return {
    isOpen,
    dialogState,
    openDialog,
    submitDialog,
  }
})
