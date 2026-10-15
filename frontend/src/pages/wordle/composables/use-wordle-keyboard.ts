import { onMounted, onUnmounted } from 'vue'
import { KEYBOARD_CODE_MAP } from '@/pages/wordle/constants/wordle-constants'

export interface WordleKeyboardHandlers {
  onLetter: (letter: string) => void
  onEnter: () => void
  onBackspace: () => void
}

interface EditableTargetLike {
  tagName?: string
  isContentEditable?: boolean
}

/** Глобальные клавиши вордли не должны перехватываться, пока пользователь печатает в поле ввода. */
export function isEditableTarget(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false

  const element = target as EditableTargetLike
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable === true
  )
}

export function useWordleKeyboard(handlers: WordleKeyboardHandlers) {
  function handleKeydown(event: KeyboardEvent) {
    if (isEditableTarget(event.target)) return
    if (event.ctrlKey || event.metaKey || event.altKey) return

    if (event.key === 'Enter') {
      event.preventDefault()
      handlers.onEnter()
      return
    }

    if (event.key === 'Backspace') {
      event.preventDefault()
      handlers.onBackspace()
      return
    }

    const key = event.key.toLowerCase()
    if (/^[а-яё]$/.test(key)) {
      handlers.onLetter(key)
      return
    }

    const mapped = KEYBOARD_CODE_MAP[event.code]
    if (mapped) handlers.onLetter(mapped)
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
}
