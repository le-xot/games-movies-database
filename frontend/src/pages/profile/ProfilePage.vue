<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ProfileRecordCard from '@/pages/profile/components/ProfileRecordCard.vue'
import { RecordEntity, UserEntity } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'

const title = useTitle()
onMounted(() => (title.value = 'Профиль'))

const user = useUser()
const api = useApi()

const data = ref<RecordEntity[]>([])
const users = ref<UserEntity[]>([])
const selectedUserId = ref<string | null>(null)
const isUsersLoading = ref(false)
const isUserSelectorOpen = ref(false)
const searchValue = ref('')

async function fetchUsers() {
  isUsersLoading.value = true
  try {
    const response = await api.users.userControllerGetAllUsers()
    users.value = response.data
  } catch (error) {
    console.error('Error fetching users:', error)
    users.value = []
  } finally {
    isUsersLoading.value = false
  }
}

async function fetchUserRecords() {
  const targetUser = selectedUserId.value
    ? users.value.find((u) => u.id === selectedUserId.value)
    : user.user

  if (!targetUser?.login) return

  try {
    const response = await api.users.userControllerGetUserRecords({ login: targetUser.login })
    data.value = response.data
  } catch (error) {
    console.error('Error fetching user records:', error)
    data.value = []
  }
}

const selectedUser = computed(() => {
  if (!selectedUserId.value) return user.user
  return users.value.find((u) => u.id === selectedUserId.value) || user.user
})

const userGames = computed(
  () => data.value?.filter((item: RecordEntity) => item.genre === 'GAME') || [],
)

const userVideos = computed(
  () =>
    data.value?.filter((item: RecordEntity) => item.genre !== 'GAME' && item.genre !== null) || [],
)

const isOwnProfile = computed(() => !selectedUserId.value || selectedUserId.value === user.user?.id)

onMounted(async () => {
  await fetchUsers()
  if (user.user?.login) {
    await fetchUserRecords()
  }
})

watch(selectedUserId, () => {
  if (selectedUser.value?.login) {
    fetchUserRecords()
  } else {
    data.value = []
  }
})

watch(
  () => user.user?.login,
  (newLogin) => {
    if (newLogin && !selectedUserId.value) {
      fetchUserRecords()
    }
  },
)

function selectUser(userId: string | null) {
  selectedUserId.value = userId
  isUserSelectorOpen.value = false
}

const filteredUsers = computed(() => {
  if (!searchValue.value) return users.value
  return users.value.filter((u) => u.login.toLowerCase().includes(searchValue.value.toLowerCase()))
})

</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <div v-if="user.isLoggedIn" class="flex items-center gap-4">
      <span class="text-lg font-medium">Профиль:</span>
      <Popover v-model:open="isUserSelectorOpen">
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            role="combobox"
            :aria-expanded="isUserSelectorOpen"
            class="w-[200px] justify-between"
          >
            {{ selectedUser?.login || 'Выберите пользователя' }}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-[200px] p-0">
          <Command>
            <div class="flex items-center border-b px-3">
              <input
                v-model="searchValue"
                class="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Искать пользователя..."
              />
            </div>
            <CommandList>
              <CommandEmpty>Пользователи не найдены.</CommandEmpty>
              <CommandGroup>
                <CommandItem :value="user.user?.id || ''" @select="() => selectUser(null)">
                  <Check
                    class="mr-2 h-4 w-4"
                    :class="[isOwnProfile ? 'opacity-100' : 'opacity-0']"
                  />
                  {{ user.user?.login }} (Мой профиль)
                </CommandItem>
                <CommandItem
                  v-for="userItem in filteredUsers.filter((u) => u.id !== user.user?.id)"
                  :key="userItem.id"
                  :value="userItem.id"
                  @select="() => selectUser(userItem.id)"
                >
                  <Check
                    class="mr-2 h-4 w-4"
                    :class="[selectedUserId === userItem.id ? 'opacity-100' : 'opacity-0']"
                  />
                  {{ userItem.login }}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>

    <div v-if="!user.isLoggedIn" class="text-center my-8">
      <p class="text-xl">Пожалуйста, авторизуйтесь для просмотра профиля</p>
    </div>

    <div v-else>
      <div v-if="userVideos.length > 0" class="mb-8">
        <p class="pb-4 text-white text-2xl">
          {{ isOwnProfile ? 'Ваши' : `${selectedUser?.login} -` }} заказанные киноленты:
          {{ userVideos.length }}
        </p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
          <ProfileRecordCard
            v-for="video in userVideos"
            :key="video.id"
            :record="video"
          />
        </div>
      </div>

      <div v-if="userGames.length > 0" class="mb-8">
        <p class="pb-4 text-white text-2xl">
          {{ isOwnProfile ? 'Ваши' : `${selectedUser?.login} -` }} заказанные игры:
          {{ userGames.length }}
        </p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
          <ProfileRecordCard
            v-for="game in userGames"
            :key="game.id"
            :record="game"
          />
        </div>
      </div>
      <div
        v-if="
          userGames.length === 0 &&
          userVideos.length === 0 &&
          user.user?.login === selectedUser?.login
        "
        class="text-center my-8"
      >
        <img class="w-[120px] h-[120px] mx-auto" src="/images/muh.webp" alt="Ага" />
        <span class="text-xl font-bold block mt-4">Вы ещё ничего не предложили</span>
      </div>
      <div
        v-else-if="
          userGames.length === 0 &&
          userVideos.length === 0 &&
          user.user?.login !== selectedUser?.login
        "
        class="text-center my-8"
      >
        <img class="w-[120px] h-[120px] mx-auto" src="/images/aga.webp" alt="Ага" />
        <span class="text-xl font-bold block mt-4">Пользователь пока ничего не предложил</span>
      </div>
    </div>
  </div>
</template>
