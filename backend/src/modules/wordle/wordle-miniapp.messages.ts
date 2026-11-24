/**
 * Адрес Mini App.
 *
 * Отдельный маршрут, а не страница сайта: в Telegram не нужны сайдбар, шапка
 * и командная палитра, зато нужен свой бутстрап (вход по `initData`).
 */
export const MINI_APP_PATH = '/tg/wordle'

/** Подпись кнопки меню рядом с полем ввода. */
export const MINI_APP_MENU_TEXT = 'Вордли'

export function buildMiniAppUrl(appPublicUrl: string): string {
  return `${appPublicUrl.replace(/\/+$/, '')}${MINI_APP_PATH}`
}

/** Bot API принимает в `web_app` только https-адреса. */
export function isMiniAppUrlSupported(url: string): boolean {
  return url.startsWith('https://')
}

export function buildMiniAppText(): string {
  return 'Слово дня ждёт. Открой игру — она запустится прямо в Telegram.'
}
