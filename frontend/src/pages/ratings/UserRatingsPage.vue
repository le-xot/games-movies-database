<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ErrorRetry from '@/components/feedback/ErrorRetry.vue'
import DataCards from '@/components/media/DataCards.vue'
import FilterGrade from '@/components/media/FilterGrade.vue'
import { useUserRatings } from '@/pages/ratings/composables/use-user-ratings'

const ratings = useUserRatings()
const {
  isMine,
  items,
  total,
  gradeFilter,
  isLoading,
  isLoadingNext,
  hasNextPage,
  error,
  profileLogin,
} = storeToRefs(ratings)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-semibold">
        {{
          isMine ? 'Мои оценки' : profileLogin ? `Оценки ${profileLogin}` : 'Оценки пользователя'
        }}
        <span class="text-muted-foreground">· {{ total }}</span>
      </h1>
      <FilterGrade :value="gradeFilter" @update="ratings.setGradeFilter" />
    </div>

    <ErrorRetry v-if="error" variant="block" :message="error" @retry="ratings.refetch()" />

    <div v-else-if="!isLoading && total === 0" class="py-16 text-center text-muted-foreground">
      {{ isMine ? 'Ты пока ничего не оценил' : 'У пользователя пока нет оценок' }}
    </div>

    <template v-else>
      <DataCards
        :items="items"
        :is-loading="isLoading"
        :is-loading-next="isLoadingNext"
        :has-next-page="hasNextPage"
        :has-episode-column="true"
        :has-error="!!error"
        delete-confirm-title="Удалить запись?"
        @update="ratings.updateRecord"
        @update-poster="ratings.updatePoster"
        @delete="ratings.deleteRecord"
        @load-more="ratings.loadNextPage"
      />
    </template>
  </div>
</template>
