import { useInfiniteQuery, useMutation } from '@pinia/colada'
import { defineStore } from 'pinia'
import { ComputedRef, computed, ref } from 'vue'
import { GetAllRecordsDTO, RecordEntity, RecordUpdateDTO, assertOk, unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import type { RecordsQueryParams } from '@/composables/factories/create-params-store'

export interface ParamsStoreReturn {
  params: RecordsQueryParams
}

export interface RecordsStoreConfig<TItems extends string, TRefetch extends string> {
  storeId: string
  queryKey: string
  paramsStore: () => ParamsStoreReturn
  itemsName: TItems
  refetchName: TRefetch
  pageSize?: number
}

const DEFAULT_PAGE_SIZE = 50

export type RecordsStoreReturn<TItems extends string, TRefetch extends string> = {
  items: ComputedRef<RecordEntity[]>
  isLoading: boolean
  error: Error | null
  hasNextPage: boolean
  isLoadingNext: boolean
  loadNextPage: () => Promise<unknown>
  retry: () => Promise<unknown>
  updateRecord: (payload: { id: number; data: RecordUpdateDTO }) => Promise<unknown>
  updatePoster: (payload: { id: number; url: string }) => Promise<unknown>
  deleteRecord: (id: number) => Promise<unknown>
} & Record<TItems, ComputedRef<RecordEntity[]>> &
  Record<TRefetch, () => Promise<unknown>>

export function createRecordsStore<TItems extends string, TRefetch extends string>(
  config: RecordsStoreConfig<TItems, TRefetch>,
) {
  return defineStore(config.storeId, () => {
    const api = useApi()
    const paramsStoreInstance = config.paramsStore()
    const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE

    const {
      isLoading,
      data,
      error,
      refetch,
      hasNextPage,
      loadNextPage: loadNextPageRaw,
    } = useInfiniteQuery<GetAllRecordsDTO, Error, number>(() => ({
      key: [config.queryKey, paramsStoreInstance.params],
      initialPageParam: 1,
      // При поиске/фильтрах ключ меняется: держим прошлую сетку до прихода новой,
      // чтобы список не схлопывался в скелетон на каждый запрос.
      placeholderData: (previous) => previous,
      query: async ({ pageParam }) => {
        return await unwrap(
          api.records.get({
            query: {
              ...paramsStoreInstance.params,
              page: pageParam,
              limit: pageSize,
            },
          }),
        )
      },
      getNextPageParam: (lastPage, allPages, lastPageParam) => {
        const loadedCount = allPages.reduce((total, page) => total + page.records.length, 0)
        return loadedCount < lastPage.total ? lastPageParam + 1 : undefined
      },
    }))

    const isLoadingNext = ref(false)

    async function loadNextPage() {
      if (isLoadingNext.value || !hasNextPage.value) return
      isLoadingNext.value = true
      try {
        await loadNextPageRaw()
      } finally {
        isLoadingNext.value = false
      }
    }

    const { mutateAsync: updateRecord } = useMutation({
      key: [config.queryKey, 'update'],
      mutation: ({ id, data: body }: { id: number; data: RecordUpdateDTO }) => {
        return assertOk(api.records({ id }).patch(body))
      },
    })

    const { mutateAsync: deleteRecord } = useMutation({
      key: [config.queryKey, 'delete'],
      mutation: (id: number) => {
        return assertOk(api.records({ id }).delete())
      },
    })

    const { mutateAsync: updatePoster } = useMutation({
      key: [config.queryKey, 'updatePoster'],
      mutation: ({ id, url }: { id: number; url: string }) => {
        return assertOk(api.records({ id }).poster.patch({ url }))
      },
    })

    const items = computed(() => {
      if (!data.value) return []
      return data.value.pages.flatMap((page) => page.records)
    })

    // Setup-стор обязан возвращать refs, а потребитель видит уже развёрнутые значения;
    // при generic-ключах ([config.itemsName]) TS не может проверить пересечение типов,
    // поэтому нужна двойная ассерция — цель при этом полностью типизирована.
    return {
      items,
      isLoading,
      error,
      hasNextPage,
      isLoadingNext,
      loadNextPage,
      retry: () => refetch(),
      [config.itemsName]: items,
      [config.refetchName]: refetch,
      updateRecord,
      updatePoster,
      deleteRecord,
    } as unknown as RecordsStoreReturn<TItems, TRefetch>
  })
}
