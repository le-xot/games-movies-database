import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'
import type { Component } from 'vue'

type ComponentPropsOf<T extends Component> = T extends abstract new (...args: unknown[]) => {
  $props: infer P
}
  ? P
  : Record<string, unknown>

export interface DialogState<T extends Component = Component> {
  title: string
  description?: string
  customContent?: Component
  onSubmit: (formData?: unknown) => void
  onCancel?: () => void
  component?: T
  props?: ComponentPropsOf<T>
}

export const useDialog = defineStore('dialog', () => {
  const isOpen = ref(false)
  const dialogState = ref<DialogState | null>(null)

  function openDialog<T extends Component>(state: DialogState<T>) {
    isOpen.value = true
    dialogState.value = {
      ...state,
      component: state.component ? markRaw(state.component) : undefined,
      customContent: state.customContent ? markRaw(state.customContent) : undefined,
    } as DialogState
  }

  function submitDialog(formData?: unknown) {
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
