import { describe, expect, it } from 'bun:test'
import { RecordGrade, RecordStatus } from '@/lib/api'
import {
  GRADE_BUTTON_ORDER,
  GRADE_REPORT_ORDER,
  GRADE_VOCABULARY,
  STATUS_REPORT_ORDER,
  STATUS_VOCABULARY,
} from '@/lib/record-vocabulary'

describe('record vocabulary', () => {
  it('описывает каждый статус и оценку', () => {
    for (const status of Object.values(RecordStatus)) {
      expect(STATUS_VOCABULARY[status]).toBeDefined()
      expect(STATUS_VOCABULARY[status].name.length).toBeGreaterThan(0)
    }
    for (const grade of Object.values(RecordGrade)) {
      expect(GRADE_VOCABULARY[grade]).toBeDefined()
      expect(GRADE_VOCABULARY[grade].name.length).toBeGreaterThan(0)
      expect(GRADE_VOCABULARY[grade].label?.length).toBeGreaterThan(0)
    }
  })

  it('держит цвет и Tailwind-класс согласованными', () => {
    const entries = [...Object.values(STATUS_VOCABULARY), ...Object.values(GRADE_VOCABULARY)]

    for (const entry of entries) {
      expect(entry.badgeClass).toContain(`[${entry.tone}]`)
      if ('borderClass' in entry && entry.borderClass) {
        expect(entry.borderClass).toContain(`[${entry.tone}]`)
      }
    }
  })

  it('покрывает заявленные порядки', () => {
    expect(new Set(STATUS_REPORT_ORDER).size).toBe(STATUS_REPORT_ORDER.length)
    expect(STATUS_REPORT_ORDER).not.toContain(RecordStatus.NOTINTERESTED)
    expect(new Set(GRADE_REPORT_ORDER).size).toBe(Object.values(RecordGrade).length)
    expect([...GRADE_BUTTON_ORDER]).toEqual([...GRADE_REPORT_ORDER].reverse())
  })
})
