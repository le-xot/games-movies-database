<script setup lang="ts">
import { gradeTags } from '@/components/table/composables/use-table-select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import Spinner from '@/components/utils/spinner.vue'
import { useApi } from '@/composables/use-api'
import { useUser } from '@/composables/use-user'
import { RecordEntity, RecordGrade } from '@/lib/api'
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'

const title = useTitle()
onMounted(() => title.value = 'Профиль')

const user = useUser()
const api = useApi()

// Состояние загрузки
const isLoading = ref(false)
const data = ref<RecordEntity[]>([])

// Функция для получения записей пользователя
async function fetchUserRecords() {
  if (!user.user?.login) return

  isLoading.value = true
  try {
    const response = await api.users.userControllerGetUserRecords({ login: user.user.login })
    data.value = response.data
  } catch (error) {
    console.error('Error fetching user records:', error)
    data.value = []
  } finally {
    isLoading.value = false
  }
}

// Разделяем записи по типам
const userGames = computed(() =>
  data.value?.filter((item: RecordEntity) => item.genre === 'GAME') || [],
)

const userVideos = computed(() =>
  data.value?.filter((item: RecordEntity) => item.genre !== 'GAME' && item.genre !== null) || [],
)

// Загружаем данные при монтировании компонента
onMounted(() => {
  if (user.user?.login) {
    fetchUserRecords()
  }
})

// Следим за изменением пользователя
watch(() => user.user?.login, (newLogin) => {
  if (newLogin) {
    fetchUserRecords()
  } else {
    data.value = []
  }
})

// Функция для форматирования даты
function formatDate(dateString: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <div v-if="isLoading" class="flex items-center justify-center">
      <Spinner />
    </div>

    <div v-else-if="!user.isLoggedIn" class="text-center my-8">
      <p class="text-xl">
        Пожалуйста, авторизуйтесь для просмотра профиля
      </p>
    </div>

    <div v-else>
      <!-- Видео контент пользователя -->
      <div v-if="userVideos.length > 0" class="mb-8">
        <p class="pb-4 text-white text-2xl">
          Ваши заказанные киноленты: {{ userVideos.length }}
        </p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
          <Card
            v-for="video in userVideos"
            :key="video.id"
            class="bg-[var(--n-action-color)] min-h-[200px] flex flex-col"
          >
            <div class="flex flex-1 h-full">
              <div v-if="video.posterUrl" class="relative w-[150px] flex-shrink-0">
                <img
                  :src="video.posterUrl"
                  class="w-full h-full object-cover rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]"
                  alt="Poster"
                >
              </div>
              <div class="flex flex-col flex-1 justify-between overflow-hidden">
                <CardHeader>
                  <CardTitle
                    class="text-xl overflow-hidden line-clamp-2 max-w-full box-border"
                    :title="video.title"
                  >
                    {{ video.title }}
                  </CardTitle>
                </CardHeader>
                <CardContent v-if="video.link" class="text-xs text-[#1e90ff] underline italic block whitespace-nowrap overflow-hidden text-ellipsis">
                  <a :href="video.link" target="_blank">
                    {{ video.link }}
                  </a>
                </CardContent>
                <CardFooter class="flex flex-col items-start w-full">
                  <div class="flex justify-between w-full items-center">
                    <div v-if="video.createdAt" class="text-sm text-muted-foreground">
                      {{ formatDate(video.createdAt) }}
                    </div>
                    <Tag v-if="video.grade" :class="gradeTags[video.grade as RecordGrade]?.class">
                      {{ gradeTags[video.grade as RecordGrade]?.name }} {{ gradeTags[video.grade as RecordGrade]?.label }}
                    </Tag>
                  </div>
                </CardFooter>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Игры пользователя -->
      <div v-if="userGames.length > 0" class="mb-8">
        <p class="pb-4 text-white text-2xl">
          Ваши заказанные игры: {{ userGames.length }}
        </p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
          <Card
            v-for="game in userGames"
            :key="game.id"
            class="bg-[var(--n-action-color)] min-h-[200px] flex flex-col"
          >
            <div class="flex flex-1 h-full">
              <div v-if="game.posterUrl" class="relative w-[150px] flex-shrink-0">
                <img
                  :src="game.posterUrl"
                  class="w-full h-full object-cover rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)]"
                  alt="Poster"
                >
              </div>
              <div class="flex flex-col flex-1 justify-between overflow-hidden">
                <CardHeader>
                  <CardTitle
                    class="text-xl overflow-hidden line-clamp-2 max-w-full box-border"
                    :title="game.title"
                  >
                    {{ game.title }}
                  </CardTitle>
                </CardHeader>
                <CardContent v-if="game.link" class="text-xs text-[#1e90ff] underline italic block whitespace-nowrap overflow-hidden text-ellipsis">
                  <a :href="game.link" target="_blank">
                    {{ game.link }}
                  </a>
                </CardContent>
                <CardFooter class="flex flex-col items-start w-full">
                  <div class="flex justify-between w-full items-center">
                    <div v-if="game.createdAt" class="text-sm text-muted-foreground">
                      {{ formatDate(game.createdAt) }}
                    </div>
                    <Tag v-if="game.grade" :class="gradeTags[game.grade as RecordGrade]?.class">
                      {{ gradeTags[game.grade as RecordGrade]?.name }} {{ gradeTags[game.grade as RecordGrade]?.label }}
                    </Tag>
                  </div>
                </CardFooter>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div v-if="userGames.length === 0 && userVideos.length === 0" class="text-center my-8">
        <img class="w-[120px] h-[120px] mx-auto" src="/images/aga.webp" alt="Ага">
        <span class="text-xl font-bold block mt-4">У вас пока нет заказов</span>
      </div>
    </div>
  </div>
</template>
