<script setup lang="ts">
import { ArrowRightIcon, Loader2Icon, MergeIcon, TriangleAlertIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import MergeUserPicker from '@/pages/admin/components/MergeUserPicker.vue'
import { useMergeAccounts } from '@/pages/admin/composables/use-merge-accounts'
import type { UserEntity } from '@/lib/api'
import type { UserAccount } from '@/pages/admin/composables/use-admin-users'

const props = defineProps<{
  users: UserEntity[]
  accounts: Record<string, UserAccount[]>
}>()

const emit = defineEmits<{
  merged: []
}>()

const {
  targetQuery,
  sourceQuery,
  isMerging,
  targetUser,
  sourceUser,
  targetResults,
  sourceResults,
  conflictingAccounts,
  canMerge,
  selectTarget,
  selectSource,
  clearTarget,
  clearSource,
  confirmMerge,
} = useMergeAccounts({
  users: () => props.users,
  accounts: () => props.accounts,
})
</script>

<template>
  <div class="mt-2 border-t pt-6">
    <h2 class="mb-1 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
      <MergeIcon class="size-5" />
      Склейка аккаунтов
    </h2>
    <p class="mb-4 text-sm text-muted-foreground">
      Выбери основной аккаунт (останется) и поглощаемый (будет удалён, его привязки и данные
      перейдут к основному).
    </p>

    <div class="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
      <MergeUserPicker
        v-model:query="targetQuery"
        label="Основной аккаунт"
        hint="останется"
        :selected="targetUser"
        :results="targetResults"
        :accounts="accounts"
        @select="selectTarget"
        @clear="clearTarget"
      />

      <ArrowRightIcon class="mx-auto hidden size-5 shrink-0 text-muted-foreground lg:block" />

      <MergeUserPicker
        v-model:query="sourceQuery"
        label="Поглощаемый аккаунт"
        hint="будет удалён"
        :selected="sourceUser"
        :results="sourceResults"
        :accounts="accounts"
        @select="selectSource"
        @clear="clearSource"
      />
    </div>

    <div v-if="targetUser && sourceUser" class="mt-4 flex flex-col gap-3">
      <div
        v-if="conflictingAccounts.length"
        class="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
      >
        <TriangleAlertIcon class="mt-0.5 size-4 shrink-0 text-destructive" />
        <div>
          <div class="font-medium">Конфликт привязок</div>
          <div class="text-muted-foreground">
            У основного уже есть
            {{ conflictingAccounts.map((a) => `${a.platform} (@${a.platformLogin})`).join(', ') }}.
            Эти привязки поглощаемого будут отброшены.
          </div>
        </div>
      </div>

      <p class="text-sm text-muted-foreground">
        Лайки и игры Wordle, которые уже есть у основного, останутся его версией.
      </p>
    </div>

    <Button
      class="mt-4"
      variant="destructive"
      :disabled="!canMerge"
      @click="confirmMerge(() => emit('merged'))"
    >
      <Loader2Icon v-if="isMerging" class="mr-2 size-4 animate-spin" />
      <MergeIcon v-else class="mr-2 size-4" />
      Объединить аккаунты
    </Button>
  </div>
</template>
