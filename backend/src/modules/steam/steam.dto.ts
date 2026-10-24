import { RecordGrade, RecordStatus } from '@backend/enums'
import { RecordEntity } from '@backend/modules/record/record.entity'

export class SteamGameDto {
  appid!: number

  name!: string

  playtime_forever!: number

  header_image!: string

  img_icon_url!: string
}

export class SteamImportGameDto {
  appId!: number

  status!: RecordStatus

  grade?: RecordGrade
}

export class SteamImportDTO {
  games!: SteamImportGameDto[]
}

export class SteamGamesResponseDTO {
  games!: SteamGameDto[]

  existingAppIds!: string[]
}

export class SteamImportFailureDto {
  appId!: number

  reason!: string
}

export class SteamImportResultDTO {
  created!: RecordEntity[]

  failed!: SteamImportFailureDto[]
}
