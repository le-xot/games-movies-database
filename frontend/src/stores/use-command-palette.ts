import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const useCommandPalette = defineStore('global/use-command-palette', () => {
  const isOpen = ref(false)

  function openPalette() {
    isOpen.value = true
  }

  function closePalette() {
    isOpen.value = false
  }

  function togglePalette() {
    isOpen.value = !isOpen.value
  }

  return {
    isOpen,
    openPalette,
    closePalette,
    togglePalette,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCommandPalette, import.meta.hot))
}
