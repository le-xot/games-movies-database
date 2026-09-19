import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoginDialog = defineStore('globals/use-login-dialog', () => {
  const isOpen = ref(false)

  function openLogin() {
    isOpen.value = true
  }

  function closeLogin() {
    isOpen.value = false
  }

  return {
    isOpen,
    openLogin,
    closeLogin,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLoginDialog, import.meta.hot))
}
