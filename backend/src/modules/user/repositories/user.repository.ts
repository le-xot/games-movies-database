import { UserRole } from '@/enums'
import { ProfileStatsDomain, UserDomain } from '@/modules/user/entities/user-domain.entity'
import { RecordEntity } from '@/modules/record/record.entity'

export interface CreateUserData {
  id: string
  login: string
  role: UserRole
  profileImageUrl: string
  color: string
}

export interface UpdateUserData {
  login?: string
  role?: UserRole
  profileImageUrl?: string
  color?: string
}

export abstract class UserRepository {
  abstract findByTwitchId(twitchId: string): Promise<UserDomain | null>
  abstract findByLogin(login: string): Promise<UserDomain | null>
  abstract findById(id: string): Promise<UserDomain | null>
  abstract create(data: CreateUserData): Promise<UserDomain>
  abstract update(id: string, data: UpdateUserData): Promise<UserDomain>
  abstract findAll(): Promise<UserDomain[]>
  abstract deleteWithCascade(userId: string): Promise<void>
  abstract getProfileStats(login: string): Promise<ProfileStatsDomain>
  abstract getProfileStatsById(id: string): Promise<ProfileStatsDomain>
  abstract getRecordsByLogin(login: string): Promise<RecordEntity[]>
  abstract getRecordsById(id: string): Promise<RecordEntity[]>
}
