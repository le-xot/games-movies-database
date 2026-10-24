export class WordleNotificationsStatusDTO {
  available!: boolean

  connected!: boolean

  telegramUsername!: string | null

  morningEnabled!: boolean

  eveningEnabled!: boolean

  morningTime!: string

  eveningTime!: string
}

export class WordleNotificationsLinkDTO {
  url!: string
}

export class WordleNotificationsUpdateDTO {
  morningEnabled?: boolean

  eveningEnabled?: boolean
}

export class WordleNotificationsDeleteDTO {
  ok!: boolean
}
