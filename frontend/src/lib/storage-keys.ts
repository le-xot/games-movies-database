/**
 * Все ключи `localStorage`/`sessionStorage` в одном месте: раньше они были
 * литералами по файлам, а `main.ts` чистил чужие ключи по строкам.
 */
export const STORAGE_KEYS = {
  appVersion: 'app_version',
  loginReturnUrl: 'loginReturnUrl',
  accountDialogOnLoad: 'accountDialogOnLoad',
  dbSidebarCollapsed: 'db-sidebar-collapsed',
  steamHidden: 'steam-hidden',
  viewedSuggestions: 'viewed-suggestions',
  suggestionSortBy: 'suggestion-sort-by',
  editorEnabled: 'editorEnabled',
  wordleColorblind: 'wordle:colorblind',
  cocktailBar: 'cocktails:guest-bar',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/**
 * Ключи, которые сбрасываются при смене версии приложения. Список обязан быть
 * подмножеством `STORAGE_KEYS` — это проверяет тест `storage-keys.spec.ts`.
 */
export const VERSIONED_STORAGE_KEYS: readonly StorageKey[] = [
  STORAGE_KEYS.viewedSuggestions,
  STORAGE_KEYS.suggestionSortBy,
]
