import { useApi } from '@/composables/use-api'
import { PersonEntity } from '@/lib/api'
import { useMutation, useQuery } from '@pinia/colada'
import { refDebounced } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const PERSONS_QUERY_KEY = 'persons'

export const useTablePersons = defineStore('use-table-persons', () => {
  const api = useApi()
  const {
    isLoading,
    data: persons,
    refetch: refetchPersons,
  } = useQuery({
    key: [PERSONS_QUERY_KEY],
    placeholderData: (prev) => prev ?? [],
    query: async () => {
      const { data } = await api.persons.personControllerGetAllPersons()
      return data
    },
  })

  const { mutateAsync: createPerson } = useMutation({
    key: [PERSONS_QUERY_KEY, 'create'],
    mutation: async (opts: { name: string, color?: string }) => {
      return await api.persons.personControllerCreatePerson(opts)
    },
    onSettled: () => refetchPersons(),
  })

  const { mutateAsync: deletePersonById } = useMutation({
    key: [PERSONS_QUERY_KEY, 'delete'],
    mutation: async (id: number) => {
      return await api.persons.personControllerDeletePersonById(id)
    },
    onSettled: () => refetchPersons(),
  })

  const patchQueue = ref<{ id: number, data: { name?: string, color?: string } } | null>(null)
  const debouncedPatchQueue = refDebounced(patchQueue, 200)

  const { mutateAsync: patchPerson } = useMutation({
    key: [PERSONS_QUERY_KEY, 'patch'],
    mutation: async (opts: { id: number, data: { name?: string, color?: string } }) => {
      return await api.persons.personControllerPatchPerson(opts.id, opts.data)
    },
    onSettled: () => refetchPersons(),
  })

  watch(debouncedPatchQueue, async (value) => {
    if (value) {
      await patchPerson(value)
    }
  })

  const updatePerson = (id: number, data: { name?: string, color?: string }) => {
    patchQueue.value = { id, data }
  }

  const personOptions = computed<PersonEntity[]>(() => {
    if (!persons.value) return []
    return persons.value.map((item) => {
      return {
        id: item.id,
        name: item.name,
        color: item.color,
      }
    })
  })

  return {
    isLoading,
    persons,
    personOptions,
    createPerson,
    updatePerson,
    deletePersonById,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTablePersons, import.meta.hot))
}
