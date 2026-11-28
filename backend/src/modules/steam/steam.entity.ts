import { RecordGrade, RecordStatus } from '@backend/enums'

/** Игра из Steam, как её отдаёт GetOwnedGames (уже с абсолютными URL картинок). */
export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  header_image: string
  img_icon_url: string
}

/** Что пользователь выбрал для импорта. */
export interface SteamImportGame {
  appId: number
  status: RecordStatus
  grade?: RecordGrade
}
