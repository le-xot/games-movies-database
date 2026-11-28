import { acceptHMRUpdate } from 'pinia'
import { createDialogStore } from '@/stores/create-dialog-store'

export const useCommandPalette = createDialogStore('global/use-command-palette')

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCommandPalette, import.meta.hot))
}
