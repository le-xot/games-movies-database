import { AccountPlatform } from '@backend/enums'
import type { SelectRow } from '@gmd/database'

export class UserAccountEntity implements SelectRow<'userAccounts'> {
  id!: number

  userId!: string

  platform!: AccountPlatform

  platformUserId!: string

  platformLogin!: string

  platformAvatar!: string | null

  createdAt!: string
}
