<script setup lang="ts">
import { DownloadIcon, Gamepad2Icon, Loader2Icon, Trash2Icon, Tv } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { TwitchIcon } from 'vue3-simple-icons'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RecordGrade, RecordStatus, type UserEntity } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'

interface UserAccount {
  id: number
  userId: string
  platform: 'TWITCH' | 'KICK'
  platformUserId: string
  platformLogin: string
  platformAvatar: string | null
  createdAt: string
}

interface SteamGame {
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

const title = useTitle()
onMounted(() => (title.value = 'Админка'))

const api = useApi()
const dialog = useDialog()
const users = ref<UserEntity[]>([])
const accounts = ref<Record<string, UserAccount[]>>({})
const isLoading = ref(true)

// Steam sync state
const steamGames = ref<SteamGame[]>([])
const existingAppIds = ref<Set<string>>(new Set())
const selected = ref<Map<number, SelectedGame>>(new Map())
const isLoadingSteam = ref(false)
const isImporting = ref(false)
const steamLoaded = ref(false)
const importResult = ref<{ created: number; failed: number } | null>(null)

const badgeSelect = useBadgeSelect()
const statusOptions = badgeSelect.options.status
const gradeOptions = [
  { value: '__none__', label: 'Нет оценки' },
  ...badgeSelect.options.grade,
]

const selectedCount = computed(() => selected.value.size)

type FilterKind = 'all' | 'existing' | 'available'
const filter = ref<FilterKind>('all')

const existingCount = computed(() =>
  steamGames.value.filter((g) => existingAppIds.value.has(String(g.appid))).length,
)
const availableCount = computed(() => steamGames.value.length - existingCount.value)

const sortedGames = computed(() => {
  return [...steamGames.value].sort((a, b) => {
    const aExists = existingAppIds.value.has(String(a.appid))
    const bExists = existingAppIds.value.has(String(b.appid))
    if (aExists !== bExists) return aExists ? 1 : -1
    return b.playtime_forever - a.playtime_forever
  })
})

const filteredGames = computed(() => {
  if (filter.value === 'existing')
    return sortedGames.value.filter((g) => existingAppIds.value.has(String(g.appid)))
  if (filter.value === 'available')
    return sortedGames.value.filter((g) => !existingAppIds.value.has(String(g.appid)))
  return sortedGames.value
})

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers() {
  isLoading.value = true
  try {
    const { data } = await api.users.userControllerGetAllUsers()
    users.value = data
    await fetchAllAccounts()
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchAllAccounts() {
  const results = await Promise.allSettled(
    users.value.map(async (user) => {
      const { data } = await api.users.userControllerGetUserAccounts(user.id, {
        format: 'json',
      } as any)
      return { userId: user.id, accounts: data as unknown as UserAccount[] }
    }),
  )
  for (const result of results) {
    if (result.status === 'fulfilled') {
      accounts.value[result.value.userId] = result.value.accounts
    }
  }
}

function deleteUser(userId: string, username: string) {
  dialog.openDialog({
    title: 'Удалить пользователя?',
    content: '',
    description: `Вы уверены, что хотите удалить пользователя ${username}?`,
    onSubmit: async () => {
      try {
        await api.users.userControllerDeleteUser(userId)
        await fetchUsers()
      } catch (error) {
        console.error('Failed to delete user:', error)
      }
    },
  })
}

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
  newSelected.set(appId, { ...entry, grade: grade === '__none__' ? null : (grade as RecordGrade) })
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
    toast.success(`Импорт завершён: добавлено ${data.created.length}, ошибок ${data.failed.length}`)
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
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Админка</h1>

    <div v-if="isLoading" class="text-center py-8 text-muted-foreground">Загрузка...</div>

    <template v-else>
      <h2 class="text-lg font-semibold text-muted-foreground">Пользователи</h2>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-4">
        <Card v-for="user in users" :key="user.id">
          <CardContent class="flex items-center gap-4 pt-6">
            <Avatar class="size-10 shrink-0">
              <AvatarImage :src="user.profileImageUrl" :alt="user.login" />
              <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
            </Avatar>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium truncate">{{ user.login }}</span>
                <Badge :variant="user.role === 'ADMIN' ? 'destructive' : 'default'" class="text-xs">
                  {{ user.role }}
                </Badge>
              </div>

              <div class="flex flex-wrap gap-1.5 mt-2">
                <template v-for="account in accounts[user.id]" :key="account.id">
                  <Badge variant="secondary" class="text-xs gap-1">
                    <TwitchIcon v-if="account.platform === 'TWITCH'" class="size-3" />
                    <Tv v-else class="size-3" />
                    {{ account.platformLogin }}
                  </Badge>
                </template>
                <span v-if="!accounts[user.id]?.length" class="text-xs text-muted-foreground">
                  Нет привязанных аккаунтов
                </span>
              </div>

              <div class="text-xs text-muted-foreground mt-2">ID: {{ user.id }}</div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              class="shrink-0 text-muted-foreground hover:text-destructive"
              @click="deleteUser(user.id, user.login)"
            >
              <Trash2Icon class="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div class="border-t pt-6 mt-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <Gamepad2Icon class="size-5" />
            Steam Sync
          </h2>
          <Button :disabled="isLoadingSteam" @click="loadSteamGames">
            <Loader2Icon v-if="isLoadingSteam" class="size-4 mr-2 animate-spin" />
            <DownloadIcon v-else class="size-4 mr-2" />
            Загрузить игры из Steam
          </Button>
        </div>

        <div v-if="importResult" class="mb-4 p-3 rounded-md bg-muted text-sm">
          Добавлено: {{ importResult.created }}, Ошибок: {{ importResult.failed }}
        </div>

        <template v-if="steamLoaded">
          <div class="flex gap-2 mb-4">
            <button
              class="px-3 py-1.5 text-sm rounded-md transition-colors"
              :class="filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'"
              @click="filter = 'all'"
            >
              Все ({{ steamGames.length }})
            </button>
            <button
              class="px-3 py-1.5 text-sm rounded-md transition-colors"
              :class="filter === 'existing' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'"
              @click="filter = 'existing'"
            >
              В базе ({{ existingCount }})
            </button>
            <button
              class="px-3 py-1.5 text-sm rounded-md transition-colors"
              :class="filter === 'available' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'"
              @click="filter = 'available'"
            >
              Доступные ({{ availableCount }})
            </button>
          </div>

          <div
            v-if="selectedCount > 0"
            class="sticky top-0 z-10 flex items-center justify-between p-3 mb-4 bg-background border rounded-lg shadow-sm"
          >
            <span class="text-sm font-medium">Выбрано: {{ selectedCount }}</span>
            <Button :disabled="isImporting" @click="importSelected">
              <Loader2Icon v-if="isImporting" class="size-4 mr-2 animate-spin" />
              <DownloadIcon v-else class="size-4 mr-2" />
              Добавить выбранные
            </Button>
          </div>

          <div class="space-y-2">
            <div
              v-for="game in filteredGames"
              :key="game.appid"
              class="flex items-center gap-3 p-3 border rounded-lg transition-colors min-w-0"
              :class="{
                'opacity-50 bg-muted/50': existingAppIds.has(String(game.appid)),
                'hover:bg-accent/50': !existingAppIds.has(String(game.appid)),
              }"
            >
              <input
                type="checkbox"
                :checked="selected.has(game.appid)"
                :disabled="existingAppIds.has(String(game.appid))"
                class="size-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                @change="toggleGame(game.appid)"
              />

              <img
                :src="game.img_icon_url"
                :alt="game.name"
                class="size-8 rounded shrink-0"
              />

              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ game.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ formatPlaytime(game.playtime_forever) }}
                </div>
              </div>

              <Badge
                v-if="existingAppIds.has(String(game.appid))"
                variant="secondary"
                class="shrink-0"
              >
                Уже добавлено
              </Badge>

              <template v-if="selected.has(game.appid) && !existingAppIds.has(String(game.appid))">
                <Select
                  :model-value="selected.get(game.appid)?.status ?? RecordStatus.DONE"
                  @update:model-value="(v) => updateStatus(game.appid, v as RecordStatus)"
                >
                  <SelectTrigger class="w-28 h-8 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  :model-value="selected.get(game.appid)?.grade ?? '__none__'"
                  @update:model-value="(v) => updateGrade(game.appid, v as string)"
                >
                  <SelectTrigger class="w-28 h-8 text-xs shrink-0">
                    <SelectValue placeholder="Нет оценки" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in gradeOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </template>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
