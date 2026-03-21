import { useApi } from '@/composables/use-api'
import { useRecordCreate } from '@/composables/use-record-create'
import { RecordEntity, RecordUpdateDTO } from '@/lib/api'
import { useMutation, useQuery } from '@pinia/colada'
import { acceptHMRUpdate, defineStore, StoreDefinition } from 'pinia'
import { computed } from 'vue'

export interface RecordStoreConfig {
  storeId: string
  queryKey: string
  paramsStoreGetter: StoreDefinition
}

export function createRecordStore(config: RecordStoreConfig) {
  const {
    storeId,
    queryKey,
    paramsStoreGetter,
  } = config

  const store = defineStore(storeId, () => {
    const api = useApi()
    const paramsStoreInstance = paramsStoreGetter()
    const pagination = paramsStoreInstance.pagination
    const recordParams = paramsStoreInstance.recordParams

    const {
      isLoading,
      data,
      refetch: refetchRecords,
    } = useQuery({
      key: () => [queryKey, recordParams.value] as any,
      placeholderData(previousData): { records: RecordEntity[], total: number } {
        if (!previousData) return { records: [], total: 0 }
        return previousData
      },
      query: async () => {
        const { data } = await api.records.recordControllerGetAllRecords(recordParams.value as any)
        return data
      },
    })

    const totalRecords = computed(() => {
      if (!data.value) return 0
      return data.value.total
    })

    const totalPages = computed(() => {
      if (!data.value) return 0
      return Math.ceil(data.value.total / pagination.pageSize)
    })

    const { mutateAsync: updateRecord } = useMutation({
      key: [queryKey, 'update'],
      mutation: ({ id, data }: { id: number, data: RecordUpdateDTO }) => {
        return api.records.recordControllerPatchRecord(id, data)
      },
    })

    const { mutateAsync: deleteRecord } = useMutation({
      key: [queryKey, 'delete'],
      mutation: (id: number) => {
        return api.records.recordControllerDeleteRecord(id)
      },
    })

    const { mutateAsync: createRecord } = useMutation({
      key: [queryKey, 'create'],
      mutation: async (link: string) => {
        const { createRecord } = useRecordCreate(queryKey, refetchRecords)
        return await createRecord(link)
      },
    })

    const records = computed(() => {
      if (!data.value) return []
      return data.value.records
    })

    return {
      isLoading,
      records,
      refetchRecords,
      updateRecord,
      deleteRecord,
      createRecord,
      totalRecords,
      totalPages,
    }
  })

  if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(store, import.meta.hot))
  }

  return store
}
