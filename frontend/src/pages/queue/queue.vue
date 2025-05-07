<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { genreTags } from '@/components/table/composables/use-table-select'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import Spinner from '@/components/utils/spinner.vue'
import { useUser } from '@/composables/use-user'
import { useAnime } from '@/pages/anime/composables/use-anime.ts'
import { ListPlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useGames } from '../games/composables/use-games'
import QueueCard from './components/queue-card.vue'
import SuggestionCard from './components/suggestion-card.vue'
import SuggestionForm from './components/suggestion-form.vue'
import { useQueue } from './composables/use-queue'
import { useSuggestion } from './composables/use-suggestion'

const games = useGames()
const anime = useAnime()
const queue = useQueue()
const suggestion = useSuggestion()
const dialog = useDialog()

const user = useUser()

const isLoading = computed(() => games.isLoading || anime.isLoading || suggestion.isLoading)

const suggestionCard = ref<InstanceType<typeof SuggestionCard> | null>(null)

function openSuggestionDialog() {
  dialog.openDialog({
    title: 'Предложить контент',
    description: 'Поддерживаются форматы:<br/><br/>https://shikimori.one/animes/1943-paprika<br/>https://www.kinopoisk.ru/film/258687',
    onSubmit: () => {},
    onCancel: () => {
      dialog.closeDialog()
    },
    component: SuggestionForm,
  })
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <div v-if="isLoading" class="flex items-center justify-center">
      <Spinner />
    </div>
    <QueueCard v-if="(queue.data?.games?.length ?? 0) > 0 && !isLoading" kind="game" :items="queue.data?.games ?? []">
      <template #title>
        Поиграть: {{ queue.data?.games?.length ?? 0 }}
      </template>
    </QueueCard>

    <QueueCard v-if="(queue.data?.videos?.length ?? 0) > 0 && !isLoading" kind="video" :items="queue.data?.videos ?? []">
      <template #title>
        Посмотреть: {{ queue.data?.videos?.length ?? 0 }}
      </template>
      <template #footer="{ item }">
        <div>
          <Tag :class="genreTags[item.genre].class">
            {{ genreTags[item.genre].name }}
          </Tag>
        </div>
      </template>
    </QueueCard>

    <SuggestionCard
      v-if="(suggestion.suggestions?.length ?? 0) > 0 && !isLoading"
      ref="suggestionCard"
      kind="suggestion"
      :items="suggestion.suggestions ?? []"
    >
      <template #title>
        <div class="flex justify-between">
          Предложения: {{ suggestion.suggestions?.length ?? 0 }}
          <Button :disabled="!user.isLoggedIn" @click="openSuggestionDialog">
            <span v-if="user.isLoggedIn" class="flex items-center gap-2">
              Предложить
              <ListPlus class="icon" />
            </span>
            <span v-else>
              Авторизуйтесь, чтобы предложить
            </span>
          </Button>
        </div>
      </template>
    </SuggestionCard>

    <div
      v-if="queue.data?.games.length === 0 && queue.data.videos.length === 0 && (suggestion.suggestions?.length ?? 0) === 0 && !isLoading"
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
      class="text-center"
    >
      <img class="w-[120px] h-[120px] mx-auto" src="/images/aga.webp" alt="Ага">
      <span class="text-xl font-bold block mt-4">Пока в очереди ничего нет</span>
      <Button class="mt-4" :disabled="!user.isLoggedIn" @click="openSuggestionDialog">
        <span v-if="user.isLoggedIn" class="flex items-center gap-2">
          Предложить
          <ListPlus class="icon" />
        </span>
        <span v-else>
          Авторизуйтесь, чтобы предложить
        </span>
      </Button>
    </div>
  </div>
</template>
