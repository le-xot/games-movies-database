export interface TelegramUser {
  id: number
  username?: string
}

export interface TelegramChat {
  id: number
  type: string
}

export interface TelegramMessage {
  text?: string
  chat: TelegramChat
  from?: TelegramUser
}

export interface TelegramUpdate {
  message?: TelegramMessage
}

export interface TelegramCommandContext {
  command: string
  payload: string | null
  chatId: string
  fromId: string
  username: string | null
}

export type TelegramCommandHandler = (context: TelegramCommandContext) => void | Promise<void>

export interface TelegramCommandDefinition {
  name: string
  description: string
  handler: TelegramCommandHandler
}

export interface TelegramMenuItem {
  command: string
  description: string
}
