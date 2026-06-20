<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
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
