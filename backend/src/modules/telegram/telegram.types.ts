export interface TelegramProfile {
  id: string
  username?: string | undefined
  firstName: string
  lastName?: string | undefined
  photoUrl?: string | undefined
}

export interface TelegramOidcClaims {
  sub?: string
  id?: number
  name?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  picture?: string
}
