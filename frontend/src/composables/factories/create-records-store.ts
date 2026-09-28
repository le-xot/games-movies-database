import { useInfiniteQuery, useMutation } from '@pinia/colada'
import { defineStore } from 'pinia'
import { ComputedRef, computed, ref, watch } from 'vue'
import { GetAllRecordsDTO, RecordEntity, RecordUpdateDTO } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import type { RecordsQueryParams } from '@/composables/factories/create-params-store'
import type { Api } from '@/lib/api'

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

type MutationResult<T extends keyof Api<unknown>['records']> = ReturnType<
  Api<unknown>['records'][T]
>

export type RecordsStoreReturn<TItems extends string, TRefetch extends string> = {
  items: ComputedRef<RecordEntity[]>
  isLoading: boolean
  hasNextPage: boolean
  isLoadingNext: boolean
  loadNextPage: () => Promise<unknown>
  updateRecord: (payload: {
    id: number
    data: RecordUpdateDTO
  }) => MutationResult<'recordControllerPatchRecord'>
  updatePoster: (payload: {
    id: number
    url: string
  }) => MutationResult<'recordControllerUpdatePoster'>
  deleteRecord: (id: number) => MutationResult<'recordControllerDeleteRecord'>
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
      refetch,
      hasNextPage,
      loadNextPage: loadNextPageRaw,
    } = useInfiniteQuery<GetAllRecordsDTO, Error, number>(() => ({
      key: [config.queryKey, paramsStoreInstance.params],
      initialPageParam: 1,
      query: async ({ pageParam }) => {
        const { data: response } = await api.records.recordControllerGetAllRecords({
          ...paramsStoreInstance.params,
          page: pageParam,
          limit: pageSize,
        })
        return response
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
        return api.records.recordControllerPatchRecord(id, body)
      },
    })

    const { mutateAsync: deleteRecord } = useMutation({
      key: [config.queryKey, 'delete'],
      mutation: (id: number) => {
        return api.records.recordControllerDeleteRecord(id)
      },
    })

    const { mutateAsync: updatePoster } = useMutation({
      key: [config.queryKey, 'updatePoster'],
      mutation: ({ id, url }: { id: number; url: string }) => {
        return api.records.recordControllerUpdatePoster(id, { url })
      },
    })

    const items = computed(() => {
      if (!data.value) return []
      return data.value.pages.flatMap((page) => page.records)
    })

    const cachedItems = ref<RecordEntity[]>([])
    watch(items, (newItems) => {
      if (newItems.length > 0) cachedItems.value = newItems
    })

    const displayItems = computed(() => {
      if (items.value.length > 0) return items.value
      if (isLoading.value && cachedItems.value.length > 0) return cachedItems.value
      return items.value
    })

    // Setup-стор обязан возвращать refs, а потребитель видит уже развёрнутые значения;
    // при generic-ключах ([config.itemsName]) TS не может проверить пересечение типов,
    // поэтому нужна двойная ассерция — цель при этом полностью типизирована.
    return {
      items: displayItems,
      isLoading,
      hasNextPage,
      isLoadingNext,
      loadNextPage,
      [config.itemsName]: displayItems,
      [config.refetchName]: refetch,
      updateRecord,
      updatePoster,
      deleteRecord,
    } as unknown as RecordsStoreReturn<TItems, TRefetch>
  })
}
