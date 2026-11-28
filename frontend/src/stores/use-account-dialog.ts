import { acceptHMRUpdate } from 'pinia'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { createDialogStore } from '@/stores/create-dialog-store'

export const ACCOUNT_DIALOG_ON_LOAD_KEY = STORAGE_KEYS.accountDialogOnLoad

export const useAccountDialog = createDialogStore('global/use-account-dialog')

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccountDialog, import.meta.hot))
}
