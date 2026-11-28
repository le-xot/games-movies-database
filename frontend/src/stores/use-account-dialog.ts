import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_KEYS } from '@/lib/storage-keys'

export const ACCOUNT_DIALOG_ON_LOAD_KEY = STORAGE_KEYS.accountDialogOnLoad

export const useAccountDialog = defineStore('global/use-account-dialog', () => {
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
