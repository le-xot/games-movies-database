import { acceptHMRUpdate } from 'pinia'
import { createDialogStore } from '@/stores/create-dialog-store'

export const useLoginDialog = createDialogStore('global/use-login-dialog')

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLoginDialog, import.meta.hot))
}
