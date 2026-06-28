import { type Ref, ref, unref } from 'vue'

export function useBadgeCol<T>(initialValue: Ref<T>, emits: (name: 'update', value: T) => void) {
  const inputValue = ref(unref(initialValue))

  function handleUpdateValue(event: string | number | null) {
    inputValue.value = event
    if (initialValue.value === inputValue.value) return
    emits('update', inputValue.value)
  }

  return {
    inputValue,
    handleUpdateValue,
  }
}
