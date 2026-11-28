/**
 * Доменные типы уведомлений Wordle. Тело PUT принимает частичный набор флагов;
 * ответы гейтвея типизированы этими же формами.
 */
export interface WordleNotificationStatus {
  available: boolean
  connected: boolean
  telegramUsername: string | null
  morningEnabled: boolean
  eveningEnabled: boolean
  morningTime: string
  eveningTime: string
}

export interface WordleNotificationLink {
  url: string
}

export interface WordleNotificationUpdate {
  morningEnabled?: boolean
  eveningEnabled?: boolean
}
