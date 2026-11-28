import { toast } from 'vue-sonner'
import { assertOk, type RecordUpdateDTO } from '@/lib/api'
import { useApi } from '@/stores/use-api'

export interface RecordMutationsOptions {
  /** Любое изменение списка: после успеха список перезапрашивается. */
  onChanged?: () => unknown | Promise<unknown>
  messages?: {
    update?: string
    poster?: string
    delete?: string
  }
}

export interface RecordMutations {
  updateRecord: (payload: { id: number; data: RecordUpdateDTO }) => Promise<void>
  updatePoster: (payload: { id: number; url: string }) => Promise<void>
  deleteRecord: (id: number) => Promise<void>
}

/**
 * Мутации записи — одинаковые для любого списка (жанры, «Мои оценки», чужие
 * оценки). Ошибка показывается тостом, успех — перезапросом списка.
 */
export function useRecordMutations(options: RecordMutationsOptions = {}): RecordMutations {
  const api = useApi()

  async function run(action: () => Promise<unknown>, message: string): Promise<void> {
    try {
      await action()
      await options.onChanged?.()
    } catch {
      toast.error(message)
    }
  }

  return {
    updateRecord: (payload) =>
      run(
        () => assertOk(api.records({ id: payload.id }).patch(payload.data)),
        options.messages?.update ?? 'Не удалось обновить запись',
      ),
    updatePoster: (payload) =>
      run(
        () => assertOk(api.records({ id: payload.id }).poster.patch({ url: payload.url })),
        options.messages?.poster ?? 'Не удалось обновить постер',
      ),
    deleteRecord: (id) =>
      run(
        () => assertOk(api.records({ id }).delete()),
        options.messages?.delete ?? 'Не удалось удалить запись',
      ),
  }
}
