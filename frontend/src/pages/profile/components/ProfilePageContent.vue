<script setup lang="ts">
import { Check, Pencil, X } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProfile } from '@/pages/profile/composables/use-profile'
import { useUser } from '@/stores/use-user'
import ConnectedAccounts from './ConnectedAccounts.vue'
import ProfileHeader from './ProfileHeader.vue'

useTitle('Профиль')

const route = useRoute()
const userStore = useUser()
const userId = computed(() => (route.params.userId as string) || undefined)

const { likes, suggestions, isLoading, error } = useProfile(userId)

const isOwnProfile = computed(() => !userId.value || userId.value === userStore.user?.id)

const isEditingNickname = ref(false)
const nicknameInput = ref('')
const nicknameError = ref('')
const isSavingNickname = ref(false)

function startEditNickname() {
  nicknameInput.value = userStore.user?.login ?? ''
  nicknameError.value = ''
  isEditingNickname.value = true
}

function cancelEditNickname() {
  isEditingNickname.value = false
  nicknameError.value = ''
}

async function saveNickname() {
  const login = nicknameInput.value.trim()
  if (!login || login.length < 2 || login.length > 32) {
    nicknameError.value = 'Ник должен быть от 2 до 32 символов'
    return
  }

  isSavingNickname.value = true
  nicknameError.value = ''

  try {
    const response = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ login }),
    })

    if (!response.ok) {
      if (response.status === 409) {
        nicknameError.value = 'Этот ник уже занят'
      } else {
        nicknameError.value = 'Ошибка при сохранении'
      }
      return
    }

    await userStore.refetchUser()
    isEditingNickname.value = false
  } catch {
    nicknameError.value = 'Ошибка при сохранении'
  } finally {
    isSavingNickname.value = false
  }
}
</script>

<template>
  <div class="container py-8 flex flex-col gap-8 h-full">
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>

    <div v-else-if="error" class="text-center py-20 text-muted-foreground text-lg">
      {{ error }}
    </div>

    <template v-else>
      <ProfileHeader v-if="userStore.user" :user="userStore.user" :is-own-profile="isOwnProfile" />

      <div v-if="isOwnProfile" class="max-w-md space-y-2">
        <div class="text-sm text-muted-foreground">Никнейм</div>
        <div v-if="!isEditingNickname" class="flex items-center gap-2">
          <span class="text-lg font-medium">{{ userStore.user?.login }}</span>
          <Button variant="ghost" size="icon" class="size-8" @click="startEditNickname">
            <Pencil class="size-4" />
          </Button>
        </div>
        <div v-else class="flex items-center gap-2">
          <Input
            v-model="nicknameInput"
            class="max-w-[200px]"
            maxlength="32"
            @keydown.enter="saveNickname"
            @keydown.escape="cancelEditNickname"
          />
          <Button
            variant="ghost"
            size="icon"
            class="size-8"
            :disabled="isSavingNickname"
            @click="saveNickname"
          >
            <Check class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-8"
            :disabled="isSavingNickname"
            @click="cancelEditNickname"
          >
            <X class="size-4" />
          </Button>
        </div>
        <p v-if="nicknameError" class="text-sm text-red-500">{{ nicknameError }}</p>
      </div>

      <ConnectedAccounts v-if="isOwnProfile" />

      <Tabs defaultValue="likes" class="w-full">
        <TabsList class="w-full flex justify-start overflow-x-auto">
          <TabsTrigger value="likes" class="min-w-fit"> Лайки ({{ likes.length }}) </TabsTrigger>
          <TabsTrigger value="suggestions" class="min-w-fit">
            Предложения ({{ suggestions.length }})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="likes" class="mt-6">
          <div v-if="likes.length > 0" class="text-muted-foreground">Лайки: {{ likes.length }}</div>
          <div v-else class="text-center py-10 text-muted-foreground">Пока нет лайков</div>
        </TabsContent>

        <TabsContent value="suggestions" class="mt-6">
          <div v-if="suggestions.length > 0" class="text-muted-foreground">
            Предложения: {{ suggestions.length }}
          </div>
          <div v-else class="text-center py-10 text-muted-foreground">Пока нет предложений</div>
        </TabsContent>
      </Tabs>
    </template>
  </div>
</template>
