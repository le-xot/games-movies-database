export interface TelegramProfile {
  id: string
  username?: string
  firstName: string
  lastName?: string
  photoUrl?: string
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
