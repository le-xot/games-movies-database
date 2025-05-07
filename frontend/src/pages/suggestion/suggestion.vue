<script setup lang="ts">
import { Button } from '@/components/ui/button'
import Spinner from '@/components/utils/spinner.vue'
import { useUser } from '@/composables/use-user'
import { ListPlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import SuggestionCard from './components/suggestion-card.vue'
import { useSuggestion } from './composables/use-suggestion'

const suggestion = useSuggestion()
const user = useUser()

const isLoading = computed(() => suggestion.isLoading)
const suggestionCard = ref<InstanceType<typeof SuggestionCard> | null>(null)
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <div v-if="isLoading" class="flex items-center justify-center">
      <Spinner />
    </div>

    <SuggestionCard
      v-if="(suggestion.suggestions?.length ?? 0) > 0 && !isLoading"
      ref="suggestionCard"
      kind="suggestion"
      :items="suggestion.suggestions ?? []"
    >
      <template #title>
        <div class="flex justify-between">
          Советы: {{ suggestion.suggestions?.length ?? 0 }}
          <Button :disabled="!user.isLoggedIn" @click="suggestion.openSuggestionDialog()">
            <span v-if="user.isLoggedIn" class="flex items-center gap-2">
              Посоветовать
              <ListPlus class="icon" />
            </span>
            <span v-else>
              Авторизуйтесь, чтобы посоветовать
            </span>
          </Button>
        </div>
      </template>
    </SuggestionCard>

    <div
      v-if="(suggestion.suggestions?.length ?? 0) === 0 && !isLoading"
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
      class="text-center flex flex-col items-center"
    >
      <img class="w-[120px] h-[120px] mx-auto" src="/images/aga.webp" alt="Ага">
      <span class="text-xl font-bold block mt-4 mb-4">Пока советов нет</span>
      <Button class="w-fit" :disabled="!user.isLoggedIn" @click="suggestion.openSuggestionDialog()">
        <span v-if="user.isLoggedIn" class="flex items-center gap-2">
          Посоветовать
          <ListPlus class="icon" />
        </span>
        <span v-else>
          Авторизуйтесь, чтобы посоветовать
        </span>
      </Button>
    </div>
  </div>
</template>
