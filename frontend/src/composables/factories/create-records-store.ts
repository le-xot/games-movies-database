import { useMutation, useQuery } from '@pinia/colada'
import { StoreDefinition, defineStore } from 'pinia'
import { ComputedRef, computed, ref, watch } from 'vue'
import { RecordEntity, RecordUpdateDTO } from '@/lib/api'
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
}

type RecordsStoreReturn<TItems extends string, TRefetch extends string> = {
  isLoading: boolean
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

    const { isLoading, data, refetch } = useQuery({
      key: () => [config.queryKey, paramsStoreInstance.params],
      placeholderData(previousData): { records: RecordEntity[]; total: number } {
        if (!previousData) return { records: [], total: 0 }
        return previousData
      },
      query: async () => {
        const { data: response } = await api.records.recordControllerGetAllRecords(
          paramsStoreInstance.params,
        )
        return response
      },
    })

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
      return data.value.records
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
      [config.itemsName]: displayItems,
      [config.refetchName]: refetch,
      updateRecord,
      updatePoster,
      deleteRecord,
    } as unknown as RecordsStoreReturn<TItems, TRefetch>
  })
}
