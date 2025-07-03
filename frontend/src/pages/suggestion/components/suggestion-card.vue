<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast/use-toast'
import { useUser } from '@/composables/use-user'
import { RecordEntity, RecordGenre, UserRole } from '@/lib/api.ts'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSuggestion } from '../composables/use-suggestion'

const props = defineProps<{ items: RecordEntity[] }>()

const { isAdmin, currentUserId } = storeToRefs(useUser())
const { toast } = useToast()
const suggestion = useSuggestion()

const groupedItems = computed(() => {
  const groups: Record<string, RecordEntity[]> = {}

  props.items.forEach(item => {
    const genre = item.genre || 'other'
    if (!groups[genre]) {
      groups[genre] = []
    }
    groups[genre].push(item)
  })

  return groups
})

function getGroupTitle(genre: string): string {
  switch (genre) {
    case RecordGenre.GAME: return 'Игры:'
    case RecordGenre.MOVIE: return 'Фильмы:'
    case RecordGenre.SERIES: return 'Сериалы:'
    case RecordGenre.ANIME: return 'Аниме:'
    case RecordGenre.CARTOON: return 'Мультфильмы:'
    default: return 'Другое:'
  }
}

const isDialogOpen = ref(false)

function resetDialogState() {
  isDialogOpen.value = false
}

defineExpose({ isDialogOpen })

watch(isDialogOpen, (newValue) => {
  if (newValue) {
    suggestion.openSuggestionDialog(resetDialogState)
  }
})

async function handleDeleteSuggestion(id: number) {
  try {
    await suggestion.deleteSuggestion(id)
    toast({
      title: 'Успешно',
      description: 'Совет удален',
      variant: 'default',
    })
  } catch {
    toast({
      title: 'Ошибка',
      description: suggestion.error || 'Не удалось удалить совет',
      variant: 'destructive',
    })
  }
}

async function handleMoveToAuction(id: number) {
  try {
    await suggestion.moveToAuction(id)
    toast({
      title: 'Успешно',
      description: 'Совет отправлен на аукцион',
      variant: 'default',
    })
  } catch {
    toast({
      title: 'Ошибка',
      description: suggestion.error || 'Не удалось отправить совет на аукцион',
      variant: 'destructive',
    })
  }
}

async function handleApproveSuggestion(id: number) {
  try {
    await suggestion.approveSuggestion(id)
    toast({
      title: 'Успешно',
      description: 'Совет одобрен',
      variant: 'default',
    })
  } catch {
    toast({
      title: 'Ошибка',
      description: suggestion.error || 'Не удалось одобрить совет',
      variant: 'destructive',
    })
  }
}

async function handleDeleteOwnSuggestion(id: number) {
  try {
    await suggestion.deleteOwnSuggestion(id)
    toast({
      title: 'Успешно',
      description: 'Ваш совет удален',
      variant: 'default',
    })
  } catch {
    toast({
      title: 'Ошибка',
      description: suggestion.error || 'Не удалось удалить совет',
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <div>
    <p class="pb-4 text-white text-2xl">
      <slot name="title" />
    </p>

    <div v-for="(groupItems, genre) in groupedItems" :key="genre" class="mb-8">
      <h3 class="text-xl text-white mb-4 font-medium">
        {{ getGroupTitle(genre) }}
      </h3>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
        <Card
          v-for="item in groupItems"
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
              <CardFooter class="flex flex-col items-start gap-3 w-full px-6 py-2">
                <div v-if="item.user" class="flex justify-between w-full">
                  <div class="flex items-center">
                    <Avatar class="w-8 h-8 mr-2">
                      <AvatarImage :src="item.user.profileImageUrl" />
                      <AvatarFallback />
                    </Avatar>
                    <div class="text-base text-white font-medium">
                      {{ item.user.login }}
                    </div>
                  </div>
                  <div
                    v-if="item.user.role === UserRole.USER && item.user.id === currentUserId" class="flex justify-end w-full mt-auto gap-2"
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      class="text-sm"
                      @click="handleDeleteOwnSuggestion(item.id)"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
                <div class="flex justify-between w-full">
                  <div v-if="isAdmin" class="flex justify-between w-full mt-auto gap-2">
                    <Button
                      size="sm"
                      class="text-sm w-32"
                      @click="handleMoveToAuction(item.id)"
                    >
                      Аукцион
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      class="text-sm w-32"
                      @click="handleApproveSuggestion(item.id)"
                    >
                      Очередь
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      class="text-sm w-32"
                      @click="handleDeleteSuggestion(item.id)"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
