import { useBreakpoints as _useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed } from 'vue'

export const useBreakpoints = defineStore('', () => {
  const breakpoints = _useBreakpoints(breakpointsTailwind)
  const isDesktop = computed(() => breakpoints.greaterOrEqual('md').value)

  return {
    isDesktop,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBreakpoints, import.meta.hot))
}
