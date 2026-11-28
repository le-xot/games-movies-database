import { ref } from 'vue'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const isColorblind = ref(localStorage.getItem(STORAGE_KEYS.wordleColorblind) === 'true')

export function useWordleSettings() {
  function setColorblind(value: boolean) {
    isColorblind.value = value
    localStorage.setItem(STORAGE_KEYS.wordleColorblind, String(value))
  }

  return { isColorblind, setColorblind }
}
