<script setup lang="ts">
import { DownloadIcon, EyeIcon, EyeOffIcon, Gamepad2Icon, Loader2Icon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RecordStatus } from '@/lib/api'
import { useSteamSync } from '@/pages/admin/composables/use-steam-sync'

const {
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
} = useSteamSync()
</script>

<template>
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
          v-for="option in filters"
          :key="option.key"
          class="px-3 py-1.5 text-sm rounded-md transition-colors"
          :class="
            filter === option.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          "
          @click="filter = option.key"
        >
          {{ option.label }} ({{ option.count }})
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
            'hover:bg-accent/50 cursor-pointer': !existingAppIds.has(String(game.appid)),
          }"
          @click="toggleGame(game.appid)"
        >
          <button
            v-if="!existingAppIds.has(String(game.appid)) && !isHidden(game.appid)"
            class="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Скрыть"
            @click.stop="hideGame(game.appid)"
          >
            <EyeOffIcon class="size-4" />
          </button>

          <button
            v-if="isHidden(game.appid) && !existingAppIds.has(String(game.appid))"
            class="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Показать"
            @click.stop="unhideGame(game.appid)"
          >
            <EyeIcon class="size-4" />
          </button>

          <input
            type="checkbox"
            :checked="selected.has(game.appid)"
            :disabled="existingAppIds.has(String(game.appid))"
            class="size-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <img :src="game.img_icon_url" :alt="game.name" class="size-8 rounded shrink-0" />

          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ game.name }}</div>
            <div class="text-xs text-muted-foreground">
              {{ formatPlaytime(game.playtime_forever) }}
            </div>
          </div>

          <Badge v-if="existingAppIds.has(String(game.appid))" variant="secondary" class="shrink-0">
            Уже добавлено
          </Badge>

          <template v-if="selected.has(game.appid) && !existingAppIds.has(String(game.appid))">
            <Select
              :model-value="selected.get(game.appid)?.status ?? RecordStatus.DONE"
              @update:model-value="(v) => updateStatus(game.appid, v as RecordStatus)"
              @click.stop
            >
              <SelectTrigger class="w-28 h-8 text-xs shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              :model-value="selected.get(game.appid)?.grade ?? '__none__'"
              @update:model-value="(v) => updateGrade(game.appid, v as string)"
              @click.stop
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
