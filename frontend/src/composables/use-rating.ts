import { useMutation, useQueryCache } from '@pinia/colada'
import { RECORDS_QUERY_KEYS } from '@/composables/query-keys'
import { useApi } from '@/stores/use-api'
import type { RecordGrade } from '@/lib/api'

/** Голосование друзей: PUT/DELETE /ratings с инвалидацией списков записей. */
export function useRating() {
  const api = useApi()
  const queryCache = useQueryCache()

  function invalidateRecords() {
    for (const key of Object.values(RECORDS_QUERY_KEYS)) {
      queryCache.invalidateQueries({ key: [key] })
    }
  }

  const { mutateAsync: rateRecord } = useMutation({
    key: ['ratings', 'rate'],
    mutation: ({ id, grade }: { id: number; grade: RecordGrade }) =>
      api.PUT('/ratings/{recordId}', { params: { path: { recordId: id } }, body: { grade } }),
    onSuccess: () => invalidateRecords(),
  })

  const { mutateAsync: unrateRecord } = useMutation({
    key: ['ratings', 'unrate'],
    mutation: (id: number) =>
      api.DELETE('/ratings/{recordId}', { params: { path: { recordId: id } } }),
    onSuccess: () => invalidateRecords(),
  })

  return { rateRecord, unrateRecord }
}
