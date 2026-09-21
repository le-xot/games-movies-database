<script setup lang="ts">
import { SearchIcon, XIcon } from '@lucide/vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PlatformBadge from '@/pages/admin/components/PlatformBadge.vue'
import type { UserEntity } from '@/lib/api'
import type { UserAccount } from '@/pages/admin/composables/use-admin-users'

defineProps<{
  label: string
  hint: string
  selected: UserEntity | null
  results: UserEntity[]
  accounts: Record<string, UserAccount[]>
}>()

const emit = defineEmits<{
  select: [id: string]
  clear: []
}>()

const query = defineModel<string>('query', { required: true })
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {{ label }}
      </span>
      <span class="text-xs text-muted-foreground">{{ hint }}</span>
    </div>

    <div v-if="selected" class="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Avatar class="size-8 shrink-0">
        <AvatarImage :src="selected.profileImageUrl" :alt="selected.login" />
        <AvatarFallback>{{ selected.login.charAt(0).toUpperCase() }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-medium">{{ selected.login }}</div>
        <div class="mt-1 flex flex-wrap gap-1">
          <PlatformBadge
            v-for="account in accounts[selected.id] ?? []"
            :key="account.id"
            :account="account"
          />
          <span v-if="!accounts[selected.id]?.length" class="text-xs text-muted-foreground">
            Нет привязок
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="size-7 shrink-0 text-muted-foreground"
        title="Убрать"
        @click="emit('clear')"
      >
        <XIcon class="size-3.5" />
      </Button>
    </div>

    <template v-else>
      <div class="relative">
        <SearchIcon
          class="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="query"
          placeholder="Поиск: логин, ID или привязанный аккаунт"
          class="h-9 pl-8"
        />
      </div>
      <div class="max-h-56 overflow-y-auto rounded-lg border">
        <div v-if="!results.length" class="px-3 py-3 text-sm text-muted-foreground">
          Никого не найдено
        </div>
        <button
          v-for="user in results"
          :key="user.id"
          type="button"
          class="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
          @click="emit('select', user.id)"
        >
          <Avatar class="size-8 shrink-0">
            <AvatarImage :src="user.profileImageUrl" :alt="user.login" />
            <AvatarFallback>{{ user.login.charAt(0).toUpperCase() }}</AvatarFallback>
          </Avatar>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5">
              <span class="truncate text-sm font-medium">{{ user.login }}</span>
              <span
                v-if="user.role === 'ADMIN'"
                class="text-[10px] font-semibold uppercase text-destructive"
              >
                admin
              </span>
            </span>
            <span class="mt-1 flex flex-wrap gap-1">
              <PlatformBadge
                v-for="account in accounts[user.id] ?? []"
                :key="account.id"
                :account="account"
              />
              <span v-if="!accounts[user.id]?.length" class="text-xs text-muted-foreground">
                Нет привязок
              </span>
            </span>
          </span>
        </button>
      </div>
    </template>
  </div>
</template>
