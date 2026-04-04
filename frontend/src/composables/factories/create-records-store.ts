import { useMutation, useQuery } from '@pinia/colada';
import { StoreDefinition, defineStore } from 'pinia';
import { ComputedRef, computed } from 'vue';
import { useApi } from '@/stores/use-api';
import { useRecordCreate } from '@/composables/use-record-create';
import { RecordEntity, RecordUpdateDTO } from '@/lib/api';

export interface ParamsStoreReturn {
  params: Record<string, any>;
  pagination: { pageIndex: number; pageSize: number };
}

export interface RecordsStoreConfig<TItems extends string, TRefetch extends string> {
  storeId: string;
  queryKey: string;
  paramsStore: StoreDefinition<any, any, any, any>;
  itemsName: TItems;
  refetchName: TRefetch;
}

type RecordsStoreReturn<TItems extends string, TRefetch extends string> = {
  isLoading: boolean;
  totalRecords: number;
  totalPages: number;
  updateRecord: (payload: { id: number; data: RecordUpdateDTO }) => Promise<any>;
  deleteRecord: (id: number) => Promise<any>;
  createRecord: (link: string) => Promise<any>;
} & Record<TItems, ComputedRef<RecordEntity[]>> &
  Record<TRefetch, () => Promise<any>>;

export function createRecordsStore<TItems extends string, TRefetch extends string>(
  config: RecordsStoreConfig<TItems, TRefetch>,
) {
  return defineStore(config.storeId, () => {
    const api = useApi();
    const paramsStoreInstance = config.paramsStore() as unknown as ParamsStoreReturn;

    const { isLoading, data, refetch } = useQuery({
      key: () => [config.queryKey, paramsStoreInstance.params],
      placeholderData(previousData): { records: RecordEntity[]; total: number } {
        if (!previousData) return { records: [], total: 0 };
        return previousData;
      },
      query: async () => {
        const { data } = await api.records.recordControllerGetAllRecords(
          paramsStoreInstance.params,
        );
        return data;
      },
    });

    const totalRecords = computed(() => {
      if (!data.value) return 0;
      return data.value.total;
    });

    const totalPages = computed(() => {
      if (!data.value) return 0;
      return Math.ceil(data.value.total / paramsStoreInstance.pagination.pageSize);
    });

    const { mutateAsync: updateRecord } = useMutation({
      key: [config.queryKey, 'update'],
      mutation: ({ id, data }: { id: number; data: RecordUpdateDTO }) => {
        return api.records.recordControllerPatchRecord(id, data);
      },
    });

    const { mutateAsync: deleteRecord } = useMutation({
      key: [config.queryKey, 'delete'],
      mutation: (id: number) => {
        return api.records.recordControllerDeleteRecord(id);
      },
    });

    const { mutateAsync: createRecord } = useMutation({
      key: [config.queryKey, 'create'],
      mutation: async (link: string) => {
        const { createRecord: create } = useRecordCreate(config.queryKey, refetch);
        return await create(link);
      },
    });

    const items = computed(() => {
      if (!data.value) return [];
      return data.value.records;
    });

    return {
      isLoading,
      [config.itemsName]: items,
      [config.refetchName]: refetch,
      updateRecord,
      deleteRecord,
      createRecord,
      totalRecords,
      totalPages,
    } as unknown as RecordsStoreReturn<TItems, TRefetch>;
  });
}
