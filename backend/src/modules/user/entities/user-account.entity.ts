import { ApiProperty } from '@nestjs/swagger'
import { AccountPlatform } from '@/enums'
import { AccountPlatform as AccountPlatformName } from '@/enums/enums.names'
import type { SelectRow } from '@gmd/database'

export class UserAccountEntity implements SelectRow<'userAccounts'> {
  @ApiProperty()
  id: number

  @ApiProperty()
  userId: string

  @ApiProperty({ enum: AccountPlatform, enumName: AccountPlatformName })
  platform: AccountPlatform

  @ApiProperty()
  platformUserId: string

  @ApiProperty()
  platformLogin: string

  @ApiProperty({ nullable: true })
  platformAvatar: string | null

  @ApiProperty()
  createdAt: Date
}
