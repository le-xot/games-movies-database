import { acceptHMRUpdate, defineStore } from 'pinia'

export const APP_TITLE_SUFFIX = 'Лешота'

export interface SetTitleOptions {
  /** `false` — заголовок без суффикса «Лешота» (например, главная уже со своим). */
  suffix?: boolean
}

export function formatTitle(text: string, options: SetTitleOptions = {}): string {
  return options.suffix === false ? text : `${text} ${APP_TITLE_SUFFIX}`
}

/**
 * Единственный владелец `document.title`. Заголовок ставит роутер из
 * `route.meta.title`; страницы не трогают документ сами.
 */
export const useTitle = defineStore('global/use-title', () => {
  function setTitle(text: string, options: SetTitleOptions = {}) {
    document.title = formatTitle(text, options)
  }

  /** Совместимый короткий алиас: всегда с суффиксом. */
  function updateTitle(text: string) {
    setTitle(text)
  }

  return { setTitle, updateTitle }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTitle, import.meta.hot))
}
