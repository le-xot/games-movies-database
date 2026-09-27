export const TelegramBotEvents = {
  COMMAND: 'telegram.bot.command',
} as const

export interface TelegramBotCommandPayload {
  command: string
  payload: string | null
  chatId: string
  fromId: string
  username: string | null
}
