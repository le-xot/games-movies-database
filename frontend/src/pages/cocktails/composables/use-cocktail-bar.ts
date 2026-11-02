import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { COCKTAIL_BAR_KEY } from '@/composables/query-keys'
import { unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'
import type { CocktailBar } from '@/pages/cocktails/types'

/** Гостевой набор живёт в браузере: без аккаунта бару негде храниться. */
export const GUEST_BAR_STORAGE_KEY = 'cocktails:guest-bar'

/** Пауза между последним кликом и `PUT`: за набор из десяти галочек платим одним запросом. */
export const BAR_SAVE_DEBOUNCE_MS = 600

export type CocktailBarMode = 'mine' | 'guest'

export function parseGuestBar(raw: string | null | undefined): string[] {
  if (!raw) return []

  const ids = new Set<string>()
  for (const part of raw.split(',')) {
    const id = part.trim()
    if (id !== '') ids.add(id)
  }

  return [...ids]
}

export function serializeGuestBar(ids: readonly string[]): string {
  return [...new Set(ids.map((id) => id.trim()).filter((id) => id !== ''))].join(',')
}

export function withToggled(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((id) => rightSet.has(id))
}

function readGuestBar(): string[] {
  try {
    return parseGuestBar(globalThis.localStorage?.getItem(GUEST_BAR_STORAGE_KEY))
  } catch {
    return []
  }
}

function writeGuestBar(ids: readonly string[]) {
  try {
    globalThis.localStorage?.setItem(GUEST_BAR_STORAGE_KEY, serializeGuestBar(ids))
  } catch {
    // Приватный режим или переполненное хранилище — набор останется жить в памяти.
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof Response && error.status === 401
}

/**
 * Состояние бара: свой набор с сервера или гостевой из `localStorage`.
 *
 * Серверное сохранение оптимистичное: локальный набор меняется сразу, `PUT`
 * уходит после паузы, а при отказе набор не откатывается — иначе пользователь
 * теряет только что расставленные галочки. Пока сервер не подтвердил набор,
 * ответ `GET /bar` его не перетирает; следующее изменение снова запустит
 * сохранение.
 */
export function useCocktailBar() {
  const api = useApi()
  const queryCache = useQueryCache()
  const userStore = useUser()
  const isLoggedIn = computed(() => userStore.isLoggedIn)

  const mode = ref<CocktailBarMode>(isLoggedIn.value ? 'mine' : 'guest')
  /** Режим выбрал пользователь: авто-откат по 401 его больше не отменяет. */
  const isUserModeChosen = ref(false)
  /** 401 на `GET /bar`: cookie протухла, свой бар недоступен до нового входа. */
  const isBarAccessDenied = ref(false)

  const guestIds = ref<string[]>(readGuestBar())
  const mineIds = ref<string[]>([])
  const saveError = ref<string | null>(null)
  const barLoadError = ref<string | null>(null)
  const hasPendingSave = ref(false)
  /** Изменения, которые сервер ещё не подтвердил: серверный набор их не перетирает. */
  const hasUnsavedChanges = ref(false)

  const canUseOwnBar = computed(() => isLoggedIn.value && !isBarAccessDenied.value)

  const {
    data: bar,
    isLoading: isBarLoading,
    error: barError,
    refetch: refetchBar,
  } = useQuery<CocktailBar>({
    key: [COCKTAIL_BAR_KEY],
    query: () => unwrap(api.cocktails.bar.get()),
    // `refetch` игнорирует `enabled`, поэтому все ручные вызовы тоже проверяют
    // авторизацию: гостю `GET /bar` гарантированно отвечает 401.
    enabled: () => isLoggedIn.value,
    gcTime: false,
  })

  const { mutateAsync: saveBar, isLoading: isMutationPending } = useMutation({
    key: [COCKTAIL_BAR_KEY, 'save'],
    mutation: (input: { ingredientIds: string[] }) => unwrap(api.cocktails.bar.put(input)),
  })

  const ingredientIds = computed(() => (mode.value === 'guest' ? guestIds.value : mineIds.value))
  const isSaving = computed(() => hasPendingSave.value || isMutationPending.value)
  /** Скелетон уместен только пока своего бара ещё нет — на рефетче он мигает. */
  const isBarInitialLoading = computed(() => isBarLoading.value && bar.value === undefined)

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function clearSaveTimer() {
    if (saveTimer === null) return
    clearTimeout(saveTimer)
    saveTimer = null
  }

  watch(bar, (value) => {
    if (!value) return
    barLoadError.value = null
    // Несохранённый набор важнее серверного: иначе `PUT`-ошибка теряет выбор.
    if (hasUnsavedChanges.value) return
    mineIds.value = value.ingredientIds
  })

  watch(isLoggedIn, (loggedIn) => {
    // Вход или выход сбрасывает последствия протухшей cookie: после логина
    // снова можно идти в свой бар.
    isBarAccessDenied.value = false
    isUserModeChosen.value = false
    mode.value = loggedIn ? 'mine' : 'guest'
    // Набор, который не успел сохраниться до выхода, досылаем после входа.
    if (loggedIn && hasUnsavedChanges.value) scheduleSave()
  })

  watch(barError, (error) => {
    if (!error) return

    if (isUnauthorized(error)) {
      isBarAccessDenied.value = true
      // Автоматический запрос (страница открылась сама) уводит в гостя, но
      // явный выбор «Мой бар» не отменяем — иначе кнопка выглядит сломанной.
      if (!isUserModeChosen.value && mode.value === 'mine') mode.value = 'guest'
      return
    }

    barLoadError.value = 'Не удалось загрузить ваш бар'
  })

  async function flushSave() {
    clearSaveTimer()
    if (!hasPendingSave.value) return

    if (mode.value !== 'mine' || !canUseOwnBar.value) {
      hasPendingSave.value = false
      return
    }

    const snapshot = [...mineIds.value]
    try {
      const saved = await saveBar({ ingredientIds: snapshot })
      queryCache.setQueryData([COCKTAIL_BAR_KEY], saved)
      hasPendingSave.value = false
      hasUnsavedChanges.value = false
      saveError.value = null
      if (!sameSet(mineIds.value, snapshot)) scheduleSave()
    } catch {
      // Локальный набор остаётся как есть: пользователь не должен терять выбор
      // из-за сети. Повторим на следующем изменении, `saveError` чистится только
      // успешной синхронизацией.
      hasPendingSave.value = false
      saveError.value = 'Не удалось сохранить бар'
    }
  }

  function scheduleSave() {
    if (mode.value !== 'mine' || !canUseOwnBar.value) return
    hasPendingSave.value = true
    clearSaveTimer()
    saveTimer = setTimeout(() => {
      void flushSave()
    }, BAR_SAVE_DEBOUNCE_MS)
  }

  function setAll(ids: readonly string[]) {
    const next = [...new Set(ids)]

    if (mode.value === 'guest') {
      guestIds.value = next
      writeGuestBar(next)
      return
    }

    // В режиме «мой бар» без доступа править нечего: набор живёт на сервере.
    if (!canUseOwnBar.value) return

    mineIds.value = next
    hasUnsavedChanges.value = true
    queryCache.setQueryData([COCKTAIL_BAR_KEY], { ingredientIds: next })
    scheduleSave()
  }

  function toggle(id: string) {
    setAll(withToggled(ingredientIds.value, id))
  }

  function switchMode(next: CocktailBarMode) {
    if (mode.value === next) return

    isUserModeChosen.value = true
    if (hasPendingSave.value) void flushSave()
    mode.value = next

    if (next === 'guest') return

    // Гость просто видит «Войдите»: `GET /bar` без cookie бессмыслен.
    if (!canUseOwnBar.value) return

    // Несохранённый набор не перечитываем и не перетираем — пробуем отправить снова.
    if (hasUnsavedChanges.value) {
      scheduleSave()
      return
    }

    if (bar.value) mineIds.value = bar.value.ingredientIds
    void refetchBar()
  }

  function reloadBar() {
    if (!canUseOwnBar.value) return
    barLoadError.value = null
    void refetchBar()
  }

  onScopeDispose(() => {
    // Уходя со страницы, не теряем последние галочки: отправляем отложенное
    // сохранение сразу, не дожидаясь дебаунса.
    if (hasPendingSave.value) void flushSave()
    clearSaveTimer()
  })

  return {
    mode,
    ingredientIds,
    isSaving,
    saveError,
    barLoadError,
    isLoggedIn,
    canUseOwnBar,
    isBarInitialLoading,
    toggle,
    setAll,
    switchMode,
    reloadBar,
  }
}
