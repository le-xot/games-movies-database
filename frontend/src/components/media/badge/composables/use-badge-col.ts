import { type Ref, ref, unref } from 'vue'

export function useBadgeCol<T extends string | number | undefined>(
  initialValue: Ref<T>,
  emits: (name: 'update', value: T) => void,
) {
  const inputValue = ref(unref(initialValue)) as Ref<T>

  function handleUpdateValue(event: T) {
    inputValue.value = event
    if (initialValue.value === inputValue.value) return
    emits('update', inputValue.value)
  }

  return {
    inputValue,
    handleUpdateValue,
  }
}
