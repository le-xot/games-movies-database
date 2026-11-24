import { WordleGameStatus } from '@backend/enums'

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

/** Состояние партии, которого хватает для текста ответа. */
export interface MiniAppGameState {
  status: WordleGameStatus
  attempts: number
  maxAttempts: number
}

const GENERIC_TEXT = 'Слово дня ждёт. Открой игру — она запустится прямо в Telegram.'

/**
 * Ответ на `/wordle`.
 *
 * Текст зависит от партии: человеку, который уже сыграл, «слово дня ждёт» —
 * неправда. `null` — аккаунта по telegram id нет; такой игрок ещё не заходил,
 * а партия заведётся сама при первой догадке.
 */
export function buildMiniAppText(state: MiniAppGameState | null): string {
  if (!state) return GENERIC_TEXT

  if (state.status === WordleGameStatus.WON) {
    return `Сегодняшнее слово угадано с ${state.attempts}-й попытки. Новая партия — после полуночи по Москве.`
  }

  if (state.status === WordleGameStatus.LOST) {
    return 'Попытки на сегодня закончились. Новая партия — после полуночи по Москве.'
  }

  if (state.attempts > 0) {
    return `Партия идёт: ${state.attempts} из ${state.maxAttempts}. Продолжи — игра откроется в Telegram.`
  }

  return GENERIC_TEXT
}
