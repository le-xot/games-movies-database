import { useTitle as _useTitle } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useTitle = defineStore('global/use-title', () => {
  const title = _useTitle('', { titleTemplate: '%s Лешота' })

  function updateTitle(text: string) {
    title.value = text
  }

  return {
    updateTitle,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTitle, import.meta.hot))
}
