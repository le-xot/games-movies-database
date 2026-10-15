import { useEventListener } from '@vueuse/core'
import { useCommandPalette } from '@/stores/use-command-palette'

export interface ShortcutEventLike {
  key: string
  code: string
  ctrlKey: boolean
  metaKey: boolean
}

export function isPaletteShortcut(event: ShortcutEventLike): boolean {
  if (!event.ctrlKey && !event.metaKey) return false

  return event.key.toLowerCase() === 'k' || event.code === 'KeyK'
}

export function useCommandPaletteHotkey() {
  const palette = useCommandPalette()

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (!isPaletteShortcut(event)) return
    event.preventDefault()
    palette.togglePalette()
  })
}
