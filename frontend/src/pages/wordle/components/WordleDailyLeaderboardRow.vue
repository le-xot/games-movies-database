<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { computed, onBeforeUnmount, ref } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { WordleGameStatus } from '@/lib/api'
import WordleGuessGrid from '@/pages/wordle/components/WordleGuessGrid.vue'
import type { WordleDailyLeaderboardEntryDTO } from '@/lib/api'

const props = withDefaults(
  defineProps<{
    entry: WordleDailyLeaderboardEntryDTO
    compact?: boolean
    isCurrentUser?: boolean
    previewMode?: 'inline' | 'popover'
  }>(),
  { previewMode: 'popover' },
)

const isOpen = ref(false)
const hoverOpened = ref(false)
const hoverCapable = useMediaQuery('(hover: hover) and (pointer: fine)')
let closeTimer: ReturnType<typeof setTimeout> | undefined

const subTextClass = computed(() => (props.compact ? 'text-[10px]' : 'text-xs'))
const rowPadding = computed(() => (props.compact ? 'py-1' : 'py-1.5'))

function openPreview() {
  if (closeTimer) clearTimeout(closeTimer)
  hoverOpened.value = true
  isOpen.value = true
}

function scheduleClose() {
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    isOpen.value = false
  }, 150)
}

function handleOpenChange(value: boolean) {
  if (value) hoverOpened.value = false
  if (closeTimer) clearTimeout(closeTimer)
  isOpen.value = value
}

/**
 * При закрытии reka возвращает фокус на триггер. Если поповер был открыт наведением,
 * этот фокус уходит на чужой триггер и соседний поповер воспринимает его как
 * focusOutside — и тоже закрывается. Для hover-сценария возврат фокуса не нужен.
 */
function handleCloseAutoFocus(event: Event) {
  if (hoverOpened.value) event.preventDefault()
}

function handleRowEnter() {
  if (props.previewMode === 'popover' && hoverCapable.value) openPreview()
}

function handleRowLeave() {
  if (props.previewMode === 'popover' && hoverCapable.value) scheduleClose()
}

function dailyResult(entry: WordleDailyLeaderboardEntryDTO) {
  return entry.status === WordleGameStatus.WON ? `с ${entry.attempts}-й попытки` : 'не угадал'
}

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<template>
  <li class="rounded-lg" :class="{ 'bg-secondary': isCurrentUser }">
    <Popover :open="isOpen" @update:open="handleOpenChange">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-left"
          :class="rowPadding"
          @mouseenter="handleRowEnter"
          @mouseleave="handleRowLeave"
        >
          <Avatar size="sm" shape="circle">
            <AvatarImage :src="entry.profileImageUrl" :alt="entry.login" />
            <AvatarFallback>{{ entry.login.slice(0, 1).toUpperCase() }}</AvatarFallback>
          </Avatar>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ entry.login }}</p>
            <p class="text-muted-foreground" :class="subTextClass">{{ dailyResult(entry) }}</p>
          </div>
          <span class="text-base font-bold">
            {{ entry.status === WordleGameStatus.WON ? entry.attempts : '—' }}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        v-if="previewMode === 'popover'"
        side="left"
        align="start"
        :side-offset="8"
        class="w-auto p-3"
        @mouseenter="openPreview"
        @mouseleave="scheduleClose"
        @open-auto-focus.prevent
        @close-auto-focus="handleCloseAutoFocus"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-medium">{{ entry.login }}</span>
            <span class="text-xs text-muted-foreground">{{ dailyResult(entry) }}</span>
          </div>
          <WordleGuessGrid :guesses="entry.guesses" />
        </div>
      </PopoverContent>
    </Popover>

    <div v-if="previewMode === 'inline' && isOpen" class="px-2 pb-2">
      <WordleGuessGrid :guesses="entry.guesses" />
    </div>
  </li>
</template>
