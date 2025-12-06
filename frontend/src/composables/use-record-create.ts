import { useApi } from "@/composables/use-api"
import { RecordCreateFromLinkDTO, RecordStatus, RecordType } from "@/lib/api"
import { useMutation } from "@pinia/colada"

export function useRecordCreate(queryKey: string, onSuccess?: () => void) {
  const api = useApi()

  const { mutateAsync: createRecord } = useMutation({
    key: [queryKey, "create"],
    mutation: async (link: string) => {
      const data: RecordCreateFromLinkDTO = {
        link,
        status: RecordStatus.QUEUE,
        type: RecordType.WRITTEN,
      }

      return await api.records.recordControllerCreateRecordFromLink(data)
    },
    onSettled: () => {
      if (onSuccess) onSuccess()
    },
  })

  return {
    createRecord,
  }
}
