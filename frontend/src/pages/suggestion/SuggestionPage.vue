<script setup lang="ts">
import { ArrowUpDown, EyeOff, ListPlus, RotateCw } from '@lucide/vue'
import { useLocalStorage } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import SuggestionCard from '@/pages/suggestion/components/SuggestionCard.vue'
import { useSuggestion } from '@/pages/suggestion/composables/use-suggestion'
import { useLoginDialog } from '@/stores/use-login-dialog'
import { useNewRecords } from '@/stores/use-new-records'
import { useUser } from '@/stores/use-user'

const suggestion = useSuggestion()
const user = useUser()
const loginDialog = useLoginDialog()

function handleSuggestClick() {
  if (!user.isInitialized) return

  if (!user.isLoggedIn) {
    loginDialog.openLogin()
    return
  }

  suggestion.openSuggestionDialog()
}

const sortBy = useLocalStorage<'date' | 'likes'>('suggestion-sort-by', 'date')

function toggleSort() {
  sortBy.value = sortBy.value === 'date' ? 'likes' : 'date'
}

function handleMarkAllAsViewed() {
  if (!suggestion.suggestions?.length) return
  const newRecords = useNewRecords()
  suggestion.suggestions.forEach((record) => {
    newRecords.markRecordAsViewed(record.id)
  })
  toast('Успешно', {
    description: 'Все записи отмечены как просмотренные',
  })
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <div
      v-if="suggestion.error"
      class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[var(--n-action-color)] px-4 py-3"
    >
      <span class="text-sm text-destructive">Не удалось загрузить советы</span>
      <Button variant="outline" size="sm" @click="suggestion.refetchSuggestions()">
        <RotateCw class="size-4" />
        Повторить
      </Button>
    </div>

    <SuggestionCard :items="suggestion.suggestions || []" :sort-by="sortBy">
      <template #title>
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Skeleton v-if="suggestion.isLoading" class="mt-1 h-6 w-28" aria-hidden="true" />
          <span v-else>Советы: {{ suggestion.suggestions?.length ?? 0 }}</span>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" class="flex w-10" @click="handleMarkAllAsViewed">
              <EyeOff class="icon" />
            </Button>
            <Button
              variant="secondary"
              class="flex items-center gap-2 px-3"
              :title="sortBy === 'date' ? 'Сортировка по дате' : 'Сортировка по лайкам'"
              @click="toggleSort"
            >
              <ArrowUpDown class="icon" />
              <span class="text-sm">{{ sortBy === 'date' ? 'Дата' : 'Лайки' }}</span>
            </Button>
            <Button @click="handleSuggestClick">
              <Skeleton v-if="!user.isInitialized" class="h-4 w-32" aria-hidden="true" />
              <span v-else-if="user.isLoggedIn" class="flex items-center gap-2">
                <span class="hidden sm:inline">Посоветовать</span>
                <ListPlus class="icon" />
              </span>
              <span v-else> Авторизуйтесь, чтобы посоветовать </span>
            </Button>
          </div>
        </div>
      </template>
    </SuggestionCard>

    <div
      v-if="
        !suggestion.isLoading && !suggestion.error && (suggestion.suggestions?.length ?? 0) === 0
      "
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)"
      class="text-center flex flex-col items-center"
    >
      <img class="w-[120px] h-[120px] mx-auto" src="/images/aga.webp" alt="Ага" />
      <span class="text-xl font-bold block mt-4 mb-4">Пока советов нет</span>
      <Button class="w-fit" @click="handleSuggestClick">
        <Skeleton v-if="!user.isInitialized" class="h-4 w-32" aria-hidden="true" />
        <span v-else-if="user.isLoggedIn" class="flex items-center gap-2">
          Посоветовать
          <ListPlus class="icon" />
        </span>
        <span v-else> Авторизуйтесь, чтобы посоветовать </span>
      </Button>
    </div>
  </div>
</template>
