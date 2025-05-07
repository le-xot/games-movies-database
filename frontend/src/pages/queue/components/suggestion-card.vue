<script setup lang="ts">
import { useDialog } from '@/components/dialog/composables/use-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast/use-toast'
import { useUser } from '@/composables/use-user'

import { SuggestionItemDto } from '@/lib/api.ts'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSuggestion } from '../composables/use-suggestion'
import SuggestionForm from './suggestion-form.vue'

const props = defineProps<{ items: SuggestionItemDto[] }>()

const isShow = (item: SuggestionItemDto) => item.title && item.user.login

const { isAdmin } = storeToRefs(useUser())
const dialog = useDialog()
const { toast } = useToast()
const suggestion = useSuggestion()

const isDialogOpen = ref(false)

function resetDialogState() {
  isDialogOpen.value = false
}

const filteredItems = computed(() =>
  props.items.filter(isShow),
)

defineExpose({ isDialogOpen })

function openSuggestionDialog() {
  dialog.openDialog({
    title: 'Предложить контент',
    description: 'Поддерживаются форматы:<br/><br/>https://shikimori.one/animes/1943-paprika<br/>https://www.kinopoisk.ru/film/258687',
    onSubmit: () => {},
    onCancel: () => {
      dialog.closeDialog()
      resetDialogState()
    },
    component: SuggestionForm,
  })
}

async function handleDeleteSuggestion(id: number) {
  try {
    await suggestion.deleteSuggestion(id)
    toast({
      title: 'Успешно',
      description: 'Предложение удалено',
      variant: 'default',
    })
  } catch {
    toast({
      title: 'Ошибка',
      description: suggestion.error || 'Не удалось удалить предложение',
      variant: 'destructive',
    })
  }
}

watch(isDialogOpen, (newValue) => {
  if (newValue) {
    openSuggestionDialog()
  }
})
</script>

<template>
  <div>
    <p class="pb-4 text-white text-2xl">
      <slot name="title" />
    </p>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
      <Card
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-[var(--n-action-color)] min-h-[200px] flex flex-col transition-[height] duration-300"
        :class="{ 'h-[250px]': isAdmin }"
      >
        <div class="flex flex-1 h-full">
          <div v-if="item.posterUrl" class="relative w-[130px] flex-shrink-0">
            <img
              :src="item.posterUrl"
              class="w-full h-full object-cover rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]"
              alt="Poster"
            >
            <div
              v-if="item.grade"
              class="absolute bottom-2 right-2 text-white text-sm font-semibold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
              :class="{
                'bg-[#28a745]': Number(item.grade) >= 8,
                'bg-[#ffc107]': Number(item.grade) >= 5 && Number(item.grade) < 8,
                'bg-[#dc3545]': Number(item.grade) < 5,
              }"
              :aria-label="`Rating: ${item.grade}`"
              style="text-shadow: 0 0 2px #000, 0 0 2px #000; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);"
            >
              {{ Number(item.grade).toFixed(1) }}
            </div>
          </div>
          <div class="flex flex-col flex-1 justify-between overflow-hidden">
            <CardHeader>
              <CardTitle
                class="text-xl overflow-hidden line-clamp-2 max-w-full box-border"
                :title="item.title"
              >
                {{ item.title }}
              </CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-[#1e90ff] underline italic block whitespace-nowrap overflow-hidden text-ellipsis">
              <a :href="item.link" target="_blank">
                {{ item.link }}
              </a>
            </CardContent>
            <CardFooter class="flex flex-col items-start gap-3 w-full">
              <div class="flex items-center gap-2">
                <Avatar class="w-8 h-8 mr-2">
                  <AvatarImage :src="item.user.profileImageUrl" />
                  <AvatarFallback />
                </Avatar>
                <div class="text-base text-white font-medium">
                  {{ item.user?.login }}
                </div>
              </div>
              <div v-if="isAdmin" class="flex gap-2">
                <Button variant="outline" size="sm" class="text-sm">
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  class="text-sm"
                  @click="handleDeleteSuggestion(item.id)"
                >
                  Delete
                </Button>
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
