import { useInfiniteQuery, type EntryKey, type UseInfiniteQueryData } from '@pinia/colada'
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { parseApiError } from '@/utils/api-error'

/** Размер страницы для всех списков записей. */
export const RECORDS_PAGE_SIZE = 50

export interface RecordsListPage<TItem> {
  items: TItem[]
  total: number
}

export interface RecordsListOptions<TItem> {
  key: EntryKey
  pageSize: number
  fetchPage: (page: number, limit: number) => Promise<RecordsListPage<TItem>>
  /** Текст, который увидит пользователь, если запрос упал. */
  errorMessage: string
  /** Держать прошлую страницу, пока грузится новая (поиск/фильтры). */
  keepPreviousData?: boolean
}

export interface RecordsList<TItem> {
  items: ComputedRef<TItem[]>
  total: ComputedRef<number>
  error: Ref<string | null>
  isLoading: Ref<boolean>
  hasNextPage: Ref<boolean>
  isLoadingNext: Ref<boolean>
  loadNextPage: () => Promise<void>
  retry: () => Promise<unknown>
}

/**
 * Следующая страница, пока загружено меньше `total`. Одна арифметика для всех
 * бесконечных списков: раньше она была продублирована в фабрике записей и в
 * пагинации оценок.
 */
export function nextPageParam(
  loadedCount: number,
  total: number,
  lastPageParam: number,
): number | undefined {
  return loadedCount < total ? lastPageParam + 1 : undefined
}

/**
 * Один бесконечный список записей: пагинация, «догрузить», ретрай и текст
 * ошибки. Отличие списков — только `key` и `fetchPage`, поэтому вызывающий
 * код не собирает механику заново.
 */
export function useRecordsList<TItem>(
  options: () => RecordsListOptions<TItem>,
): RecordsList<TItem> {
  const listError = ref<string | null>(null)

  const {
    data,
    isLoading,
    refetch,
    hasNextPage,
    loadNextPage: loadNextPageRaw,
  } = useInfiniteQuery<RecordsListPage<TItem>, Error, number>(() => {
    const config = options()

    return {
      key: config.key,
      initialPageParam: 1,
      ...(config.keepPreviousData
        ? {
            placeholderData: (
              previous: UseInfiniteQueryData<RecordsListPage<TItem>, number> | undefined,
            ) => previous,
          }
        : {}),
      query: async ({ pageParam }: { pageParam: number }) => {
        listError.value = null
        try {
          return await config.fetchPage(pageParam, config.pageSize)
        } catch (error) {
          listError.value = await parseApiError(error, config.errorMessage)
          throw error
        }
      },
      getNextPageParam: (
        lastPage: RecordsListPage<TItem>,
        allPages: RecordsListPage<TItem>[],
        lastPageParam: number,
      ) => {
        const loadedCount = allPages.reduce((sum, page) => sum + page.items.length, 0)

        return nextPageParam(loadedCount, lastPage.total, lastPageParam)
      },
    }
  })

  const isLoadingNext = ref(false)

  async function loadNextPage(): Promise<void> {
    if (isLoadingNext.value || !hasNextPage.value) return

    isLoadingNext.value = true
    try {
      await loadNextPageRaw()
    } finally {
      isLoadingNext.value = false
    }
  }

  return {
    items: computed(() => data.value?.pages.flatMap((page) => page.items) ?? []),
    total: computed(() => data.value?.pages[data.value.pages.length - 1]?.total ?? 0),
    error: listError,
    isLoading,
    hasNextPage,
    isLoadingNext,
    loadNextPage,
    retry: () => refetch(),
  }
}
