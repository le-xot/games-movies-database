import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Все boolean-модалки (аккаунт, вход, палитра) — одно состояние и один набор
 * методов. Раньше три стора копировали друг друга и называли методы по-разному.
 */
export function createDialogStore(id: string) {
  return defineStore(id, () => {
    const isOpen = ref(false)

    function open() {
      isOpen.value = true
    }

    function close() {
      isOpen.value = false
    }

    function toggle() {
      isOpen.value = !isOpen.value
    }

    return { isOpen, open, close, toggle }
  })
}
