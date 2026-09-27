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
