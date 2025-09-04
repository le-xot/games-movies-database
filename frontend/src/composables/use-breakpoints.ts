import { useBreakpoints as _useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed } from 'vue'

export const useBreakpoints = defineStore('breakpoints', () => {
  const breakpoints = _useBreakpoints(breakpointsTailwind)
  const isDesktop = computed(() => breakpoints.greaterOrEqual('md').value)
  const isTablet = computed(() => breakpoints.between('sm', 'lg').value)
  const isMobile = computed(() => breakpoints.smaller('sm').value)
  const isCompact = computed(() => breakpoints.smaller('lg').value)

  return {
    isDesktop,
    isTablet,
    isMobile,
    isCompact,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBreakpoints, import.meta.hot))
}
