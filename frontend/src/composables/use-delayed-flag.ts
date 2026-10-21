import { computed, onScopeDispose, ref, watch } from 'vue'

/**
 * Показывает индикатор только если условие держится дольше `delay`.
 * Быстрые ответы не успевают мигнуть скелетоном/спиннером.
 */
export function useDelayedFlag(source: () => boolean, delay = 150) {
  const active = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  const clear = () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  watch(
    source,
    (value) => {
      clear()
      if (!value) {
        active.value = false
        return
      }
      timer = setTimeout(() => {
        active.value = true
      }, delay)
    },
    { immediate: true },
  )

  onScopeDispose(clear)

  return computed(() => active.value)
}
