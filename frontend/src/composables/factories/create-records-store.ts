import { defineStore } from 'pinia'
import { useRecordMutations } from '@/composables/factories/record-mutations'
import { useRecordsList } from '@/composables/factories/records-list'
import { unwrap, type RecordEntity, type RecordUpdateDTO } from '@/lib/api'
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
  items: RecordEntity[]
  isLoading: boolean
  error: string | null
  hasNextPage: boolean
  isLoadingNext: boolean
  loadNextPage: () => Promise<unknown>
  retry: () => Promise<unknown>
  updateRecord: (payload: { id: number; data: RecordUpdateDTO }) => Promise<unknown>
  updatePoster: (payload: { id: number; url: string }) => Promise<unknown>
  deleteRecord: (id: number) => Promise<unknown>
} & Record<TItems, RecordEntity[]> &
  Record<TRefetch, () => Promise<unknown>>

/**
 * Стор жанрового списка: тонкая надстройка над `useRecordsList` (пагинация и
 * ошибки) и `useRecordMutations` (правка/постер/удаление). Собственной
 * механики списка здесь больше нет.
 */
export function createRecordsStore<TItems extends string, TRefetch extends string>(
  config: RecordsStoreConfig<TItems, TRefetch>,
) {
  return defineStore(config.storeId, () => {
    const api = useApi()
    const paramsStoreInstance = config.paramsStore()
    const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE

    const list = useRecordsList(() => ({
      key: [config.queryKey, paramsStoreInstance.params],
      pageSize,
      keepPreviousData: true,
      errorMessage: 'Не удалось загрузить записи',
      fetchPage: async (page, limit) => {
        const data = await unwrap(
          api.records.get({
            query: {
              ...paramsStoreInstance.params,
              page,
              limit,
            },
          }),
        )

        return { items: data.records, total: data.total }
      },
    }))

    const mutations = useRecordMutations({
      onChanged: () => list.retry(),
    })

    // Setup-стор обязан возвращать refs, а потребитель видит уже развёрнутые значения;
    // при generic-ключах ([config.itemsName]) TS не может проверить пересечение типов,
    // поэтому нужна двойная ассерция — цель при этом полностью типизирована.
    return {
      items: list.items,
      isLoading: list.isLoading,
      error: list.error,
      hasNextPage: list.hasNextPage,
      isLoadingNext: list.isLoadingNext,
      loadNextPage: list.loadNextPage,
      retry: () => list.retry(),
      [config.itemsName]: list.items,
      [config.refetchName]: () => list.retry(),
      ...mutations,
    } as unknown as RecordsStoreReturn<TItems, TRefetch>
  })
}
