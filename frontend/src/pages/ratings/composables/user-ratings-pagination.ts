import type { GetUserRatingsEntity } from '@/lib/api'

/** Следующий pageParam для бесконечного списка оценок: пока загружено меньше total. */
export function getNextRatingsPageParam(
  lastPage: GetUserRatingsEntity,
  allPages: GetUserRatingsEntity[],
  lastPageParam: number,
): number | undefined {
  const loadedCount = allPages.reduce((total, page) => total + page.items.length, 0)
  return loadedCount < lastPage.total ? lastPageParam + 1 : undefined
}
