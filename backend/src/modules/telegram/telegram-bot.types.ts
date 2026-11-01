/**
 * Контекст команды в терминах домена.
 *
 * grammY-контекст сюда не протекает: домен не знает про фреймворк и транспорт,
 * поэтому `TelegramBotService` переводит `Context` в эту структуру.
 */
export interface TelegramCommandContext {
  command: string
  /** Хвост команды: `/start wordle_abc` → `wordle_abc`. */
  payload: string | null
  chatId: string
  fromId: string
  username: string | null
}

export type TelegramCommandHandler = (context: TelegramCommandContext) => void | Promise<void>

/**
 * Обработчик deep-link `/start <payload>`.
 *
 * Payload из ссылки непрозрачен, поэтому каждая фича сама решает, её ли это
 * ссылка: `true` — обработала, `false` — пусть попробует следующая.
 */
export type TelegramStartHandler = (context: TelegramCommandContext) => boolean | Promise<boolean>

export interface TelegramMenuItem {
  command: string
  description: string
}
