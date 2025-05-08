<script setup lang="ts">
import { genreTags, gradeTags, statusTags } from '@/components/table/composables/use-table-select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Spinner from '@/components/utils/spinner.vue'
import { useApi } from '@/composables/use-api'
import { useUser } from '@/composables/use-user'
import { GameEntity, GenresEnum, VideoEntity } from '@/lib/api'
import { useTitle } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

// Определяем тип для ключей сортировки
type SortKey = 'title' | 'grade' | 'status'

const title = useTitle()
onMounted(() => title.value = 'Профиль')

const user = useUser()
const api = useApi()
const userVideos = ref<VideoEntity[]>([])
const userGames = ref<GameEntity[]>([])
const isLoadingVideos = ref(true)
const isLoadingGames = ref(true)

// Добавить состояние для фильтрации и сортировки
const searchQuery = ref('')
const sortBy = ref<SortKey>('title')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Отфильтрованные и отсортированные видео
const filteredVideos = computed(() => {
  let result = userVideos.value

  // Фильтрация по поисковому запросу
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(video =>
      video.title?.toLowerCase().includes(query) || '',
    )
  }

  // Сортировка
  result = [...result].sort((a, b) => {
    // Используем явную типизацию для доступа к свойствам
    const aValue = a[sortBy.value] as string | null | undefined
    const bValue = b[sortBy.value] as string | null | undefined

    // Обработка null/undefined значений
    const aCompare = aValue ?? ''
    const bCompare = bValue ?? ''

    if (sortOrder.value === 'asc') {
      return aCompare > bCompare ? 1 : -1
    } else {
      return aCompare < bCompare ? 1 : -1
    }
  })

  return result
})

onMounted(async () => {
  if (user.isLoggedIn) {
    await Promise.all([
      fetchUserVideos(),
      fetchUserGames(),
    ])
  }
})

async function fetchUserVideos() {
  isLoadingVideos.value = true
  try {
    const { data } = await api.videos.videoControllerGetAllVideos({
      search: user.user?.login,
      limit: 1000,
    })
    userVideos.value = data.videos
  } catch (error) {
    console.error('Failed to fetch user videos:', error)
  } finally {
    isLoadingVideos.value = false
  }
}

async function fetchUserGames() {
  isLoadingGames.value = true
  try {
    const { data } = await api.games.gameControllerGetAllGames({
      search: user.user?.login,
      limit: 1000,
    })
    userGames.value = data.games
  } catch (error) {
    console.error('Failed to fetch user games:', error)
  } finally {
    isLoadingGames.value = false
  }
}

function getVideosByGenre(genre: GenresEnum) {
  return userVideos.value.filter(video => video.genre === genre)
}

const movieVideos = computed(() => getVideosByGenre(GenresEnum.MOVIE))
const seriesVideos = computed(() => getVideosByGenre(GenresEnum.SERIES))
const animeVideos = computed(() => getVideosByGenre(GenresEnum.ANIME))
const cartoonVideos = computed(() => getVideosByGenre(GenresEnum.CARTOON))
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <CardHeader class="flex flex-row items-center">
        <Avatar class="size-12">
          <AvatarImage :src="user.user?.profileImageUrl || ''" :alt="user.user?.login || ''" />
          <AvatarFallback>{{ user.user?.login.charAt(0).toUpperCase() }}</AvatarFallback>
        </Avatar>
        <div class="ml-4">
          <CardTitle>{{ user.user?.login }}</CardTitle>
          <CardDescription>{{ user.user?.role }}</CardDescription>
        </div>
      </CardHeader>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Мои заказы:</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs default-value="videos" class="w-full">
          <TabsList class="grid grid-cols-6 mb-4">
            <TabsTrigger value="videos">
              Все
            </TabsTrigger>
            <TabsTrigger value="games">
              Игры
            </TabsTrigger>
            <TabsTrigger value="movies">
              Фильмы
            </TabsTrigger>
            <TabsTrigger value="series">
              Сериалы
            </TabsTrigger>
            <TabsTrigger value="anime">
              Аниме
            </TabsTrigger>
            <TabsTrigger value="cartoon">
              Мультфильмы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <div class="flex flex-col md:flex-row gap-4 mb-4">
              <div class="flex-1">
                <Input v-model="searchQuery" placeholder="Поиск по названию..." />
              </div>
              <div class="flex gap-2">
                <Select v-model="sortBy">
                  <SelectTrigger class="w-[180px]">
                    <SelectValue placeholder="Сортировать по" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">
                      Название
                    </SelectItem>
                    <SelectItem value="grade">
                      Оценка
                    </SelectItem>
                    <SelectItem value="status">
                      Статус
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="sortOrder">
                  <SelectTrigger class="w-[180px]">
                    <SelectValue placeholder="Порядок" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">
                      По возрастанию
                    </SelectItem>
                    <SelectItem value="asc">
                      По убыванию
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div v-if="isLoadingVideos" class="flex justify-center py-4">
              <Spinner />
            </div>
            <div v-else-if="filteredVideos.length === 0" class="text-center py-4 text-muted-foreground">
              Нет данных о просмотренных кинолентах
            </div>
            <div v-else class="w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="text-left w-[60%]">
                      Название
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Эпизоды
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Жанр
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Статус
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Оценка
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="video in filteredVideos" :key="video.id">
                    <TableCell class="font-medium">
                      {{ video.title }}
                    </TableCell>
                    <TableCell class="text-center">
                      {{ video.episode || '' }}
                    </TableCell>
                    <TableCell class="text-center">
                      <span v-if="video.genre" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="genreTags[video.genre]?.class">
                        {{ genreTags[video.genre]?.name }}
                      </span>
                      <span v-else>-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="statusTags[video.status]?.class">
                        {{ statusTags[video.status]?.name }}
                      </span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="gradeTags[video.grade]?.class">
                        {{ gradeTags[video.grade]?.name }}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="text-sm text-muted-foreground p-2 text-right">
              Всего записей: {{ filteredVideos.length }}
            </div>
          </TabsContent>

          <TabsContent value="games">
            <div v-if="isLoadingGames" class="flex justify-center py-4">
              <Spinner />
            </div>
            <div v-else-if="userGames.length === 0" class="text-center py-4 text-muted-foreground">
              Нет данных об играх
            </div>
            <div v-else class="w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="text-left w-[80%]">
                      Название
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Статус
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Оценка
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="game in userGames" :key="game.id">
                    <TableCell class="font-medium">
                      {{ game.title }}
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="statusTags[game.status]?.class">
                        {{ statusTags[game.status]?.name }}
                      </span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="gradeTags[game.grade]?.class">
                        {{ gradeTags[game.grade]?.name }}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="text-sm text-muted-foreground p-2 text-right">
              Всего записей: {{ userGames.length }}
            </div>
          </TabsContent>

          <TabsContent value="movies">
            <div v-if="isLoadingVideos" class="flex justify-center py-4">
              <Spinner />
            </div>
            <div v-else-if="movieVideos.length === 0" class="text-center py-4 text-muted-foreground">
              Нет данных о просмотренных фильмах
            </div>
            <div v-else class="w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="text-left w-[70%]">
                      Название
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Эпизоды
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Статус
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Оценка
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="video in movieVideos" :key="video.id">
                    <TableCell class="font-medium">
                      {{ video.title }}
                    </TableCell>
                    <TableCell class="text-center">
                      {{ video.episode || '' }}
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="statusTags[video.status]?.class">
                        {{ statusTags[video.status]?.name }}
                      </span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="gradeTags[video.grade]?.class">
                        {{ gradeTags[video.grade]?.name }}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="text-sm text-muted-foreground p-2 text-right">
              Всего записей: {{ movieVideos.length }}
            </div>
          </TabsContent>

          <TabsContent value="series">
            <div v-if="isLoadingVideos" class="flex justify-center py-4">
              <Spinner />
            </div>
            <div v-else-if="seriesVideos.length === 0" class="text-center py-4 text-muted-foreground">
              Нет данных о просмотренных сериалах
            </div>
            <div v-else class="w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="text-left w-[70%]">
                      Название
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Эпизоды
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Статус
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Оценка
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="video in seriesVideos" :key="video.id">
                    <TableCell class="font-medium">
                      {{ video.title }}
                    </TableCell>
                    <TableCell class="text-center">
                      {{ video.episode || '' }}
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="statusTags[video.status]?.class">
                        {{ statusTags[video.status]?.name }}
                      </span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="gradeTags[video.grade]?.class">
                        {{ gradeTags[video.grade]?.name }}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="text-sm text-muted-foreground p-2 text-right">
              Всего записей: {{ seriesVideos.length }}
            </div>
          </TabsContent>

          <TabsContent value="anime">
            <div v-if="isLoadingVideos" class="flex justify-center py-4">
              <Spinner />
            </div>
            <div v-else-if="animeVideos.length === 0" class="text-center py-4 text-muted-foreground">
              Нет данных о просмотренных аниме
            </div>
            <div v-else class="w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="text-left w-[70%]">
                      Название
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Эпизоды
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Статус
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Оценка
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="video in animeVideos" :key="video.id">
                    <TableCell class="font-medium">
                      {{ video.title }}
                    </TableCell>
                    <TableCell class="text-center">
                      {{ video.episode || '' }}
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="statusTags[video.status]?.class">
                        {{ statusTags[video.status]?.name }}
                      </span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="gradeTags[video.grade]?.class">
                        {{ gradeTags[video.grade]?.name }}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="text-sm text-muted-foreground p-2 text-right">
              Всего записей: {{ animeVideos.length }}
            </div>
          </TabsContent>

          <TabsContent value="cartoon">
            <div v-if="isLoadingVideos" class="flex justify-center py-4">
              <Spinner />
            </div>
            <div v-else-if="cartoonVideos.length === 0" class="text-center py-4 text-muted-foreground">
              Нет данных о просмотренных мультфильмах
            </div>
            <div v-else class="w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="text-left w-[70%]">
                      Название
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Эпизоды
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Статус
                    </TableHead>
                    <TableHead class="text-left w-[10%]">
                      Оценка
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="video in cartoonVideos" :key="video.id">
                    <TableCell class="font-medium">
                      {{ video.title }}
                    </TableCell>
                    <TableCell class="text-center">
                      {{ video.episode || '' }}
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="statusTags[video.status]?.class">
                        {{ statusTags[video.status]?.name }}
                      </span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="gradeTags[video.grade]?.class">
                        {{ gradeTags[video.grade]?.name }}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div class="text-sm text-muted-foreground p-2 text-right">
              Всего записей: {{ cartoonVideos.length }}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>
