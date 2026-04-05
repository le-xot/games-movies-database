import { LikeDomain } from '../entities/like.entity'

export abstract class LikeRepository {
  abstract findByUserAndRecord(userId: string, recordId: number): Promise<LikeDomain | null>
  abstract create(userId: string, recordId: number): Promise<LikeDomain>
  abstract deleteByUserAndRecord(userId: string, recordId: number): Promise<number>
  abstract findByRecord(recordId: number): Promise<LikeDomain[]>
  abstract findByUser(userId: string): Promise<LikeDomain[]>
  abstract findMany(skip: number, take: number): Promise<LikeDomain[]>
  abstract countAll(): Promise<number>
}
