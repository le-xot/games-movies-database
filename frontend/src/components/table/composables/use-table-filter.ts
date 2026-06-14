import { type Ref, ref } from 'vue'

export function useTableFilter<T>(initialValue: T[] | null = null) {
  const selected = ref(initialValue) as Ref<T[] | null>

  function toggle(item: T) {
    if (selected.value === null) {
      selected.value = [item]
      return
    }
    const index = selected.value.indexOf(item)
    if (index === -1) {
      selected.value = [...selected.value, item]
    } else {
      const next = selected.value.filter((s) => s !== item)
      selected.value = next.length ? next : null
    }
  }

  function reset() {
    selected.value = null
  }

  return { selected, toggle, reset }
}
