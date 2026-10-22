import { refDebounced } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import {
  PathsRecordsGetParametersQueryDirection,
  PathsRecordsGetParametersQueryOrderBy,
  RecordType,
  unwrap,
} from '@/lib/api'
import { useApi } from '@/stores/use-api'
import type { RouteItem } from '@/components/layout/db/use-db-navigation'
import type { RecordEntity } from '@/lib/api'
import type { Ref } from 'vue'

export function filterCommands<T extends { name: string }>(
  commands: readonly T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...commands]

  return commands.filter((command) => command.name.toLowerCase().includes(normalized))
}

export interface LatestGuard {
  next(): number
  isLatest(token: number): boolean
}

export function createLatestGuard(): LatestGuard {
  let latest = 0

  return {
    next: () => {
      latest += 1
      return latest
    },
    isLatest: (token) => token === latest,
  }
}

export const PALETTE_RECORD_LIMIT = 8
export const PALETTE_RECENT_LIMIT = 6

const SEARCH_DEBOUNCE_MS = 300

export function useCommandPaletteSearch(options: {
  isOpen: Ref<boolean>
  commands: Ref<RouteItem[]>
}) {
  const api = useApi()

  const query = ref('')
  const debouncedQuery = refDebounced(query, SEARCH_DEBOUNCE_MS)
  const records = ref<RecordEntity[]>([])
  const isLoading = ref(false)

  const guard = createLatestGuard()
  let lastRequestedQuery: string | null = null

  const isSearching = computed(() => query.value.trim().length > 0)
  const commandResults = computed(() => filterCommands(options.commands.value, query.value))

  async function loadRecords(search: string) {
    lastRequestedQuery = search
    const token = guard.next()
    isLoading.value = true

    try {
      const data = await unwrap(
        api.GET('/records', {
          params: {
            query: {
              type: RecordType.WRITTEN,
              search,
              orderBy: PathsRecordsGetParametersQueryOrderBy.id,
              direction: PathsRecordsGetParametersQueryDirection.desc,
              limit: search ? PALETTE_RECORD_LIMIT : PALETTE_RECENT_LIMIT,
            },
          },
        }),
      )

      if (!guard.isLatest(token)) return
      records.value = data.records ?? []
    } catch {
      if (guard.isLatest(token)) records.value = []
    } finally {
      if (guard.isLatest(token)) isLoading.value = false
    }
  }

  watch(debouncedQuery, (value) => {
    if (!options.isOpen.value) return
    if (value === lastRequestedQuery) return
    void loadRecords(value)
  })

  watch(options.isOpen, (open) => {
    if (!open) return
    query.value = ''
    void loadRecords('')
  })

  return { query, commandResults, records, isLoading, isSearching }
}
