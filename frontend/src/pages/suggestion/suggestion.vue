<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { useNewRecords } from "@/composables/use-new-records.ts"
import { useUser } from "@/composables/use-user"
import { useLocalStorage } from "@vueuse/core"
import { ArrowUpDown, EyeOff, ListPlus } from "lucide-vue-next"
import { ref } from "vue"
import { toast } from "vue-sonner"
import SuggestionCard from "./components/suggestion-card.vue"
import { useSuggestion } from "./composables/use-suggestion"

const suggestion = useSuggestion()
const user = useUser()

const suggestionCard = ref<InstanceType<typeof SuggestionCard> | null>(null)
const sortBy = useLocalStorage<"date" | "likes">("suggestion-sort-by", "date")

function toggleSort() {
  sortBy.value = sortBy.value === "date" ? "likes" : "date"
}

function handleMarkAllAsViewed() {
  suggestion.suggestions?.forEach(record => {
    const newRecords = useNewRecords()
    newRecords.markRecordAsViewed(record.id)
    toast({ title: "Успешно", description: "Все записи отмечены как просмотренные", variant: "default" })
  })
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <SuggestionCard
      v-if="(suggestion.suggestions?.length ?? 0) > 0"
      ref="suggestionCard"
      :items="suggestion.suggestions || []"
      :sort-by="sortBy"
    >
      <template #title>
        <div class="flex justify-between">
          Советы: {{ suggestion.suggestions?.length ?? 0 }}
          <div class="flex gap-2">
            <Button variant="outline" class="flex w-10" @click="handleMarkAllAsViewed">
              <EyeOff class="icon" />
            </Button>
            <Button
              variant="secondary"
              class="flex items-center gap-2 px-3 w-24"
              :title="sortBy === 'date' ? 'Сортировка по дате' : 'Сортировка по лайкам'"
              @click="toggleSort"
            >
              <ArrowUpDown class="icon" />
              <span class="text-sm">{{ sortBy === 'date' ? 'Дата' : 'Лайки' }}</span>
            </Button>
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
        </div>
      </template>
    </SuggestionCard>

    <div
      v-if="(suggestion.suggestions?.length ?? 0) === 0"
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
