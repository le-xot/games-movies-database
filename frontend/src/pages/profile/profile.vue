<!-- <script setup lang="ts">
import { genreTags, gradeTags, statusTags } from '@/components/table/composables/use-table-select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Spinner from '@/components/utils/spinner.vue'
import { useApi } from '@/composables/use-api'
import { useUser } from '@/composables/use-user'
import { RecordEntity, RecordGenre, RecordGrade, RecordStatus, UserEntity } from '@/lib/api'
import { useTitle } from '@vueuse/core'
import { EyeIcon, EyeOffIcon } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

type SortKey = 'title' | 'grade' | 'status'

const title = useTitle()
onMounted(() => title.value = 'Профиль')

const user = useUser()
const api = useApi()
const userRecords = ref<RecordEntity[]>([])
const userGames = ref<RecordEntity[]>([])
const isLoadingRecords = ref(true)
const isLoadingGames = ref(true)

const allUsers = ref<UserEntity[]>([])
const selectedUserId = ref<string>('')
const viewingUser = ref<UserEntity | null>(null)
const isLoadingUsers = ref(false)

const searchQuery = ref('')
const sortBy = ref<SortKey>('title')
const sortOrder = ref<'asc' | 'desc'>('asc')

const isAdmin = computed(() => user.user?.role === 'ADMIN')

// Функция для безопасного получения тега жанра
function getGenreTag(genre: string | null | undefined) {
  if (!genre) return null
  return genreTags[genre as RecordGenre]
}

// Функция для безопасного получения тега статуса
function getStatusTag(status: string | null | undefined) {
  if (!status) return null
  return statusTags[status as RecordStatus]
}

// Функция для безопасного получения тега оценки
function getGradeTag(grade: string | null | undefined) {
  if (!grade) return null
  return gradeTags[grade as RecordGrade]
}

const filteredVideos = computed(() => {
  let result = userRecords.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(video =>
      video.title?.toLowerCase().includes(query),
    )
  }

  result = [...result].sort((a, b) => {
    let aValue: any = a[sortBy.value]
    let bValue: any = b[sortBy.value]

    // Обработка undefined и null значений
    aValue = aValue ?? ''
    bValue = bValue ?? ''

    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return result
})

async function fetchAllUsers() {
  if (!isAdmin.value) return

  isLoadingUsers.value = true
  try {
    const response = await api.users.userControllerGetAllUsers()
    if (response && response.data) {
      allUsers.value = response.data.filter(u => u.id !== user.user?.id)
    } else {
      console.warn('Empty response data for users')
      allUsers.value = []
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
    allUsers.value = []
  } finally {
    isLoadingUsers.value = false
  }
}

async function fetchUserVideos(login?: string) {
  isLoadingRecords.value = true
  try {
    const targetLogin = login || user.user?.login || ''
    const response = await api.users.userControllerGetUserRecords({
      login: targetLogin,
    })

    // Проверяем, что response и response.data существуют
    if (response && response.data) {
      userRecords.value = response.data.filter(r => r.genre !== RecordGenre.GAME)
    } else {
      console.warn('Empty response data for videos')
      userRecords.value = []
    }
  } catch (error) {
    console.error('Failed to fetch user videos:', error)
    userRecords.value = []
  } finally {
    isLoadingRecords.value = false
  }
}

async function fetchUserGames(login?: string) {
  isLoadingGames.value = true
  try {
    const targetLogin = login || user.user?.login || ''
    const response = await api.users.userControllerGetUserRecords({
      login: targetLogin,
    })

    // Проверяем, что response и response.data существуют
    if (response && response.data) {
      userGames.value = response.data.filter(r => r.genre === RecordGenre.GAME)
    } else {
      console.warn('Empty response data for games')
      userGames.value = []
    }
  } catch (error) {
    console.error('Failed to fetch user games:', error)
    userGames.value = []
  } finally {
    isLoadingGames.value = false
  }
}

async function viewUserProfile() {
  if (!selectedUserId.value) return

  const selectedUser = allUsers.value.find(u => u.id === selectedUserId.value)
  if (selectedUser) {
    viewingUser.value = selectedUser
    await Promise.all([
      fetchUserVideos(selectedUser.login),
      fetchUserGames(selectedUser.login),
    ])
  }
}

function resetToOwnProfile() {
  viewingUser.value = null
  selectedUserId.value = ''
  Promise.all([
    fetchUserVideos(),
    fetchUserGames(),
  ])
}

function getVideosByGenre(genre: RecordGenre) {
  return userRecords.value.filter(video => video.genre === genre)
}

const movieVideos = computed(() => getVideosByGenre(RecordGenre.MOVIE))
const seriesVideos = computed(() => getVideosByGenre(RecordGenre.SERIES))
const animeVideos = computed(() => getVideosByGenre(RecordGenre.ANIME))
const cartoonVideos = computed(() => getVideosByGenre(RecordGenre.CARTOON))

onMounted(async () => {
  if (user.isLoggedIn) {
    if (isAdmin.value) {
      await fetchAllUsers()
    }
    await Promise.all([
      fetchUserVideos(),
      fetchUserGames(),
    ])
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card v-if="isAdmin">
      <CardHeader>
        <CardTitle>Просмотр профиля</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="viewingUser" class="flex items-center gap-2">
          <div class="text-sm text-yellow-500 font-medium">
            Просмотр профиля: {{ viewingUser.login }}
          </div>
          <Button variant="outline" size="sm" @click="resetToOwnProfile">
            <EyeOffIcon class="size-4 mr-2" />
            Вернуться к своему профилю
          </Button>
        </div>
        <div v-else class="flex items-center gap-2">
          <Select v-model="selectedUserId">
            <SelectTrigger class="w-[200px]">
              <SelectValue placeholder="Выберите пользователя" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="u in allUsers" :key="u.id" :value="u.id">
                {{ u.login }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" :disabled="!selectedUserId" @click="viewUserProfile">
            <EyeIcon class="size-4 mr-2" />
            Смотреть профиль
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center">
        <Avatar class="size-12">
          <AvatarImage
            :src="viewingUser?.profileImageUrl || user.user?.profileImageUrl || ''"
            :alt="viewingUser?.login || user.user?.login || ''"
          />
          <AvatarFallback>
            {{ (viewingUser?.login || user.user?.login || '').charAt(0).toUpperCase() }}
          </AvatarFallback>
        </Avatar>
        <div class="ml-4">
          <CardTitle>{{ viewingUser?.login || user.user?.login }}</CardTitle>
          <CardDescription>{{ viewingUser?.role || user.user?.role }}</CardDescription>
        </div>
      </CardHeader>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Мои записи:</CardTitle>
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
                    <SelectItem value="asc">
                      По возрастанию
                    </SelectItem>
                    <SelectItem value="desc">
                      По убыванию
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div v-if="isLoadingRecords" class="flex justify-center py-4">
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
                      <span v-if="getGenreTag(video.genre)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getGenreTag(video.genre)?.class">
                        {{ getGenreTag(video.genre)?.name }}
                      </span>
                      <span v-else>-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span v-if="getStatusTag(video.status)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getStatusTag(video.status)?.class">
                        {{ getStatusTag(video.status)?.name }}
                      </span>
                      <span v-else>-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span v-if="getGradeTag(video.grade)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getGradeTag(video.grade)?.class">
                        {{ getGradeTag(video.grade)?.name }}
                      </span>
                      <span v-else>-</span>
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
                      <span v-if="getStatusTag(game.status)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getStatusTag(game.status)?.class">
                        {{ getStatusTag(game.status)?.name }}
                      </span>
                      <span v-else>-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span v-if="getGradeTag(game.grade)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getGradeTag(game.grade)?.class">
                        {{ getGradeTag(game.grade)?.name }}
                      </span>
                      <span v-else>-</span>
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
            <div v-if="isLoadingRecords" class="flex justify-center py-4">
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
                      <span v-if="getStatusTag(video.status)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getStatusTag(video.status)?.class">
                        {{ getStatusTag(video.status)?.name }}
                      </span>
                      <span v-else>-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span v-if="getGradeTag(video.grade)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getGradeTag(video.grade)?.class">
                        {{ getGradeTag(video.grade)?.name }}
                      </span>
                      <span v-else>-</span>
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
            <div v-if="isLoadingRecords" class="flex justify-center py-4">
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
                      <span v-if="getStatusTag(video.status)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getStatusTag(video.status)?.class">
                        {{ getStatusTag(video.status)?.name }}
                      </span>
                      <span v-else>-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span v-if="getGradeTag(video.grade)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getGradeTag(video.grade)?.class">
                        {{ getGradeTag(video.grade)?.name }}
                      </span>
                      <span v-else>-</span>
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
            <div v-if="isLoadingRecords" class="flex justify-center py-4">
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
                      <span v-if="getStatusTag(video.status)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getStatusTag(video.status)?.class">
                        {{ getStatusTag(video.status)?.name }}
                      </span>
                      <span v-else>-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span v-if="getGradeTag(video.grade)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getGradeTag(video.grade)?.class">
                        {{ getGradeTag(video.grade)?.name }}
                      </span>
                      <span v-else>-</span>
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
            <div v-if="isLoadingRecords" class="flex justify-center py-4">
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
                      <span v-if="getStatusTag(video.status)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getStatusTag(video.status)?.class">
                        {{ getStatusTag(video.status)?.name }}
                      </span>
                      <span v-else>-</span>
                    </TableCell>
                    <TableCell class="text-center">
                      <span v-if="getGradeTag(video.grade)" class="px-2 py-0.5 rounded text-xs text-white w-full inline-block" :class="getGradeTag(video.grade)?.class">
                        {{ getGradeTag(video.grade)?.name }}
                      </span>
                      <span v-else>-</span>
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
</template> -->
