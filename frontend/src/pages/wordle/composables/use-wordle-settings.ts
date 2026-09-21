import { ref } from 'vue'

const STORAGE_KEY = 'wordle:colorblind'

const isColorblind = ref(localStorage.getItem(STORAGE_KEY) === 'true')

export function useWordleSettings() {
  function setColorblind(value: boolean) {
    isColorblind.value = value
    localStorage.setItem(STORAGE_KEY, String(value))
  }

  return { isColorblind, setColorblind }
}
