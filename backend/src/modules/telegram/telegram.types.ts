export type TelegramAuthMode = 'login' | 'link'
export type TelegramAuthStatus = 'pending' | 'confirmed'

export interface TelegramProfile {
  id: string
  username?: string
  firstName: string
  lastName?: string
  photoUrl?: string
}

export interface TelegramAuthRecord {
  status: TelegramAuthStatus
  mode: TelegramAuthMode
  userId?: string
  origin?: string
  profile?: TelegramProfile
  createdAt: number
}

export interface TelegramUser {
  id: number
  is_bot?: boolean
  first_name: string
  last_name?: string
  username?: string
}

export interface TelegramChat {
  id: number
  type: string
}

export interface TelegramInlineKeyboardButton {
  text: string
  callback_data: string
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][]
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  text?: string
  reply_markup?: TelegramInlineKeyboardMarkup
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export interface TelegramPhotoSize {
  file_id: string
  width: number
  height: number
}
