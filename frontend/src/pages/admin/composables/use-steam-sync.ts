import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import { RecordGrade, RecordStatus } from '@/lib/api'
import { useApi } from '@/stores/use-api'

export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  header_image: string
  img_icon_url: string
}

interface SelectedGame {
  status: RecordStatus
  grade: RecordGrade | null
}

type FilterKind = 'all' | 'existing' | 'available' | 'hidden'

export function useSteamSync() {
  const api = useApi()
  const badgeSelect = useBadgeSelect()

  const steamGames = ref<SteamGame[]>([])
  const existingAppIds = ref<Set<string>>(new Set())
  const selected = ref<Map<number, SelectedGame>>(new Map())
  const hiddenAppIds = useLocalStorage<number[]>('steam-hidden', [])
  const isLoadingSteam = ref(false)
  const isImporting = ref(false)
  const steamLoaded = ref(false)
  const importResult = ref<{ created: number; failed: number } | null>(null)
  const filter = ref<FilterKind>('all')

  const statusOptions = badgeSelect.options.status
  const gradeOptions = [{ value: '__none__', label: 'Нет оценки' }, ...badgeSelect.options.grade]
  const selectedCount = computed(() => selected.value.size)

  function isHidden(appId: number): boolean {
    return hiddenAppIds.value.includes(appId)
  }

  const sortedGames = computed(() => {
    return [...steamGames.value].sort((a, b) => {
      const aExists = existingAppIds.value.has(String(a.appid))
      const bExists = existingAppIds.value.has(String(b.appid))
      if (aExists !== bExists) return aExists ? 1 : -1
      return b.playtime_forever - a.playtime_forever
    })
  })

  const categorizedGames = computed(() => {
    const existing: SteamGame[] = []
    const hidden: SteamGame[] = []
    const available: SteamGame[] = []

    for (const game of sortedGames.value) {
      if (existingAppIds.value.has(String(game.appid))) {
        existing.push(game)
      } else if (isHidden(game.appid)) {
        hidden.push(game)
      } else {
        available.push(game)
      }
    }

    return { existing, hidden, available }
  })

  const filters = computed(() => [
    { key: 'all' as FilterKind, label: 'Все', count: steamGames.value.length },
    {
      key: 'existing' as FilterKind,
      label: 'В базе',
      count: categorizedGames.value.existing.length,
    },
    {
      key: 'available' as FilterKind,
      label: 'Доступные',
      count: categorizedGames.value.available.length,
    },
    { key: 'hidden' as FilterKind, label: 'Скрытые', count: categorizedGames.value.hidden.length },
  ])

  const filteredGames = computed(() => {
    if (filter.value === 'all') return sortedGames.value
    return categorizedGames.value[filter.value]
  })

  async function loadSteamGames() {
    isLoadingSteam.value = true
    importResult.value = null
    try {
      const { data } = await api.steam.steamControllerGetSteamGames()
      steamGames.value = data.games
      existingAppIds.value = new Set(data.existingAppIds)
      steamLoaded.value = true
      selected.value = new Map()
    } catch (error) {
      console.error('Failed to load Steam games:', error)
      toast.error('Ошибка загрузки игр из Steam')
    } finally {
      isLoadingSteam.value = false
    }
  }

  function toggleGame(appId: number) {
    if (existingAppIds.value.has(String(appId))) return
    const newSelected = new Map(selected.value)
    if (newSelected.has(appId)) {
      newSelected.delete(appId)
    } else {
      newSelected.set(appId, { status: RecordStatus.DONE, grade: null })
    }
    selected.value = newSelected
  }

  function updateStatus(appId: number, status: RecordStatus) {
    const entry = selected.value.get(appId)
    if (!entry) return
    const newSelected = new Map(selected.value)
    newSelected.set(appId, { ...entry, status })
    selected.value = newSelected
  }

  function updateGrade(appId: number, grade: string) {
    const entry = selected.value.get(appId)
    if (!entry) return
    const newSelected = new Map(selected.value)
    newSelected.set(appId, {
      ...entry,
      grade: grade === '__none__' ? null : (grade as RecordGrade),
    })
    selected.value = newSelected
  }

  async function importSelected() {
    if (selected.value.size === 0) return
    isImporting.value = true
    try {
      const games = [...selected.value.entries()].map(([appId, opts]) => ({
        appId,
        status: opts.status,
        grade: opts.grade ?? undefined,
      }))
      const { data } = await api.steam.steamControllerImportSteamGames({ games })
      importResult.value = { created: data.created.length, failed: data.failed.length }
      toast.success(
        `Импорт завершён: добавлено ${data.created.length}, ошибок ${data.failed.length}`,
      )
      await loadSteamGames()
    } catch (error) {
      console.error('Failed to import games:', error)
      toast.error('Ошибка импорта игр')
    } finally {
      isImporting.value = false
    }
  }

  function formatPlaytime(minutes: number): string {
    if (minutes === 0) return 'Не играл'
    const hours = Math.floor(minutes / 60)
    if (hours === 0) return `${minutes} мин`
    return `${hours} ч`
  }

  function hideGame(appId: number) {
    if (!isHidden(appId)) {
      hiddenAppIds.value = [...hiddenAppIds.value, appId]
    }
  }

  function unhideGame(appId: number) {
    hiddenAppIds.value = hiddenAppIds.value.filter((id) => id !== appId)
  }

  return {
    steamGames,
    existingAppIds,
    selected,
    isLoadingSteam,
    isImporting,
    steamLoaded,
    importResult,
    filter,
    filters,
    filteredGames,
    selectedCount,
    statusOptions,
    gradeOptions,
    isHidden,
    loadSteamGames,
    toggleGame,
    updateStatus,
    updateGrade,
    importSelected,
    formatPlaytime,
    hideGame,
    unhideGame,
  }
}
