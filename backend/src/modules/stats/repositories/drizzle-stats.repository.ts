import { records } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, count, eq, isNotNull, isNull, ne, or } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'

export interface GenreCount {
  genre: RecordGenre
  count: number
}

export interface StatusCount {
  status: RecordStatus
  count: number
}

export interface GradeCount {
  grade: RecordGrade
  count: number
}

export interface GenreStatusCount {
  genre: RecordGenre
  status: RecordStatus
  count: number
}

export interface GenreGradeCount {
  genre: RecordGenre
  grade: RecordGrade
  count: number
}

@Injectable()
export class DrizzleStatsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get scope() {
    return and(
      eq(records.type, RecordType.WRITTEN),
      or(isNull(records.status), ne(records.status, RecordStatus.NOTINTERESTED)),
    )
  }

  async countTotal(): Promise<number> {
    const [result] = await this.drizzle.db
      .select({ value: count() })
      .from(records)
      .where(this.scope)
    return result?.value ?? 0
  }

  async countByGenre(): Promise<GenreCount[]> {
    const rows = await this.drizzle.db
      .select({ genre: records.genre, value: count() })
      .from(records)
      .where(and(this.scope, isNotNull(records.genre)))
      .groupBy(records.genre)
    return rows.flatMap((row) => (row.genre ? [{ genre: row.genre, count: row.value }] : []))
  }

  async countByStatus(): Promise<StatusCount[]> {
    const rows = await this.drizzle.db
      .select({ status: records.status, value: count() })
      .from(records)
      .where(and(this.scope, isNotNull(records.status)))
      .groupBy(records.status)
    return rows.flatMap((row) => (row.status ? [{ status: row.status, count: row.value }] : []))
  }

  async countByGrade(): Promise<GradeCount[]> {
    const rows = await this.drizzle.db
      .select({ grade: records.grade, value: count() })
      .from(records)
      .where(and(this.scope, isNotNull(records.grade)))
      .groupBy(records.grade)
    return rows.flatMap((row) => (row.grade ? [{ grade: row.grade, count: row.value }] : []))
  }

  async countByGenreStatus(): Promise<GenreStatusCount[]> {
    const rows = await this.drizzle.db
      .select({ genre: records.genre, status: records.status, value: count() })
      .from(records)
      .where(and(this.scope, isNotNull(records.genre), isNotNull(records.status)))
      .groupBy(records.genre, records.status)
    return rows.flatMap((row) =>
      row.genre && row.status ? [{ genre: row.genre, status: row.status, count: row.value }] : [],
    )
  }

  async countByGenreGrade(): Promise<GenreGradeCount[]> {
    const rows = await this.drizzle.db
      .select({ genre: records.genre, grade: records.grade, value: count() })
      .from(records)
      .where(and(this.scope, isNotNull(records.genre), isNotNull(records.grade)))
      .groupBy(records.genre, records.grade)
    return rows.flatMap((row) =>
      row.genre && row.grade ? [{ genre: row.genre, grade: row.grade, count: row.value }] : [],
    )
  }
}
