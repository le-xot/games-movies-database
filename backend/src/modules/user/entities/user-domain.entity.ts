import { UserRole } from '@/enums'

export interface UserDomain {
  id: string
  login: string
  role: UserRole
  profileImageUrl: string
  color: string
  createdAt: Date
}

export interface RecordsByGenreItem {
  genre: string
  count: number
}

export interface GradeDistributionItem {
  grade: string
  count: number
}

export interface ProfileStatsDomain {
  totalRecords: number
  recordsByGenre: RecordsByGenreItem[]
  gradeDistribution: GradeDistributionItem[]
  totalLikesReceived: number
}
