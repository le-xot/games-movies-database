import { useLocalStorage } from "@vueuse/core"
import { acceptHMRUpdate, defineStore } from "pinia"

export const useNewRecords = defineStore("global/use-new-records", () => {
  const viewedRecords = useLocalStorage<number[]>("viewed-suggestions", [])

  const markRecordAsViewed = (recordId: number) => {
    if (!viewedRecords.value.includes(recordId)) {
      viewedRecords.value = [...viewedRecords.value, recordId]
    }
  }

  const isRecordNew = (recordId: number) => {
    return !viewedRecords.value.includes(recordId)
  }

  const getNewRecordsCount = (recordIds: number[]) => {
    return recordIds.filter(id => isRecordNew(id)).length
  }

  const cleanupViewedRecords = (currentRecordIds: number[]) => {
    const currentIds = new Set(currentRecordIds)
    viewedRecords.value = viewedRecords.value.filter(id => currentIds.has(id))
  }

  return {
    markRecordAsViewed,
    isRecordNew,
    getNewRecordsCount,
    cleanupViewedRecords,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNewRecords, import.meta.hot))
}
