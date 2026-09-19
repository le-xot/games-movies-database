import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const ACCOUNT_DIALOG_ON_LOAD_KEY = 'accountDialogOnLoad'

export const useAccountDialog = defineStore('globals/use-account-dialog', () => {
  const isOpen = ref(false)

  function openAccount() {
    isOpen.value = true
  }

  function closeAccount() {
    isOpen.value = false
  }

  return {
    isOpen,
    openAccount,
    closeAccount,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccountDialog, import.meta.hot))
}
