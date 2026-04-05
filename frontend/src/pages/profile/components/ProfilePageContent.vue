<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { genreTags } from '@/components/table/composables/use-table-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecordGenre } from '@/lib/api'
import { useProfile } from '@/pages/profile/composables/use-profile'
import { useUser } from '@/stores/use-user'
import ProfileHeader from './ProfileHeader.vue'
import ProfileRecordCard from './ProfileRecordCard.vue'
import ProfileStatsBlock from './ProfileStatsBlock.vue'

useTitle('Профиль')

const route = useRoute()
const userStore = useUser()
const userId = computed(() => (route.params.userId as string) || undefined)

const { records, profileStats, isLoading, error, recordsByGenre } = useProfile(userId)

const isOwnProfile = computed(() => !userId.value || userId.value === userStore.user?.id)
const profileUser = computed(() => records.value[0]?.user ?? null)

const TABS = [
  RecordGenre.MOVIE,
  RecordGenre.SERIES,
  RecordGenre.ANIME,
  RecordGenre.CARTOON,
  RecordGenre.GAME,
]
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
      <div
        v-if="records.length === 0"
        class="flex flex-col items-center justify-center py-20 gap-6 text-center"
      >
        <template v-if="isOwnProfile">
          <img src="/images/muh.webp" alt="Empty" class="max-w-[300px] object-contain" />
          <p class="text-2xl font-semibold">Вы ещё ничего не предложили</p>
        </template>
        <template v-else>
          <img src="/images/aga.webp" alt="Empty" class="max-w-[300px] object-contain" />
          <p class="text-2xl font-semibold">Пользователь пока ничего не предложил</p>
        </template>
      </div>

      <template v-else>
        <ProfileHeader v-if="profileUser" :user="profileUser" :is-own-profile="isOwnProfile" />

        <ProfileStatsBlock v-if="profileStats" :stats="profileStats" />

        <Tabs defaultValue="MOVIE" class="w-full">
          <TabsList class="w-full flex justify-start overflow-x-auto">
            <TabsTrigger v-for="genre in TABS" :key="genre" :value="genre" class="min-w-fit">
              {{ genreTags[genre]?.name || genre }}
            </TabsTrigger>
          </TabsList>

          <TabsContent v-for="genre in TABS" :key="genre" :value="genre" class="mt-6">
            <div
              v-if="recordsByGenre[genre] && recordsByGenre[genre].length > 0"
              class="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-4"
            >
              <ProfileRecordCard
                v-for="record in recordsByGenre[genre]"
                :key="record.id"
                :record="record"
              />
            </div>
            <div v-else class="text-center py-10 text-muted-foreground">
              В этой категории пока нет записей
            </div>
          </TabsContent>
        </Tabs>
      </template>
    </template>
  </div>
</template>
