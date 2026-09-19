import { useInfiniteQuery, useMutation } from '@pinia/colada'
import { StoreDefinition, defineStore } from 'pinia'
import { ComputedRef, computed, ref, watch } from 'vue'
import { GetAllRecordsDTO, RecordEntity, RecordUpdateDTO } from '@/lib/api'
import { useApi } from '@/stores/use-api'

export interface ParamsStoreReturn {
  params: Record<string, any>
}

export interface RecordsStoreConfig<TItems extends string, TRefetch extends string> {
  storeId: string
  queryKey: string
  paramsStore: StoreDefinition<any, any, any, any>
  itemsName: TItems
  refetchName: TRefetch
  pageSize?: number
}

const DEFAULT_PAGE_SIZE = 50

type RecordsStoreReturn<TItems extends string, TRefetch extends string> = {
  isLoading: boolean
  hasNextPage: boolean
  isLoadingNext: boolean
  loadNextPage: () => Promise<unknown>
  updateRecord: (payload: { id: number; data: RecordUpdateDTO }) => Promise<any>
  updatePoster: (payload: { id: number; url: string }) => Promise<any>
  deleteRecord: (id: number) => Promise<any>
} & Record<TItems, ComputedRef<RecordEntity[]>> &
  Record<TRefetch, () => Promise<any>>

export function createRecordsStore<TItems extends string, TRefetch extends string>(
  config: RecordsStoreConfig<TItems, TRefetch>,
) {
  return defineStore(config.storeId, () => {
    const api = useApi()
    const paramsStoreInstance = config.paramsStore() as unknown as ParamsStoreReturn
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

    return {
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
