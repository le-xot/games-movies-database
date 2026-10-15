function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
}

export const PALETTE_SHORTCUT_HINT = isApplePlatform() ? '⌘K' : 'Ctrl+K'
