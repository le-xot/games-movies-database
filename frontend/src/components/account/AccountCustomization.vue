<script setup lang="ts">
import { AVATAR_FRAMES, USER_BADGES } from '@gmdb/contract'
import { Check, Lock } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import UserAvatar from '@/components/user/UserAvatar.vue'
import { assertOk, unwrap } from '@/lib/api'
import { resolveBadge } from '@/lib/user-customization'
import { cn } from '@/lib/utils'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'
import type { UserEntity } from '@/lib/api'

/**
 * Выбор косметики профиля: рамка аватара и бейдж.
 *
 * Рамки — чекпоинты: условие достаточно выполнить один раз, после этого рамка
 * открыта навсегда. Список открытых отдаёт `GET /auth/me/customization` (он же
 * досчитывает только что заработанное), у заблокированных показываем условие.
 * Бейджи пока свободный выбор из каталога.
 */
const props = defineProps<{
  user: UserEntity
}>()

const api = useApi()
const userStore = useUser()

const frameId = ref<string | null>(props.user.avatarFrameId ?? null)
const badgeId = ref<string | null>(props.user.activeBadgeId ?? null)
const unlockedFrameIds = ref<string[]>([])
const isLoading = ref(true)
const pending = ref<'frame' | 'badge' | null>(null)

const unlockedFrames = computed(() => new Set(unlockedFrameIds.value))

const badges = computed(() =>
  USER_BADGES.map((badge) => ({ ...badge, icon: resolveBadge(badge.id)?.icon })),
)

// После `refetchUser()` (в том числе из других мест) превью догоняет сервер.
watch(
  () => [props.user.avatarFrameId, props.user.activeBadgeId] as const,
  ([frame, badge]) => {
    frameId.value = frame ?? null
    badgeId.value = badge ?? null
  },
)

async function loadCustomization() {
  try {
    const state = await unwrap(api.auth.me.customization.get())
    frameId.value = state.avatarFrameId ?? null
    badgeId.value = state.activeBadgeId ?? null
    unlockedFrameIds.value = state.unlockedAvatarFrameIds
  } catch {
    toast.error('Не удалось загрузить косметику профиля')
  } finally {
    isLoading.value = false
  }
}

async function selectFrame(next: string | null) {
  if (pending.value) return

  const previous = frameId.value
  frameId.value = next
  pending.value = 'frame'

  try {
    await assertOk(api.auth.me.customization.patch({ avatarFrameId: next }))
    await userStore.refetchUser()
    toast.success(next ? 'Рамка обновлена' : 'Рамка сброшена')
  } catch {
    frameId.value = previous
    toast.error('Не удалось сохранить рамку')
  } finally {
    pending.value = null
  }
}

async function selectBadge(next: string | null) {
  if (pending.value) return

  const previous = badgeId.value
  badgeId.value = next
  pending.value = 'badge'

  try {
    await assertOk(api.auth.me.customization.patch({ activeBadgeId: next }))
    await userStore.refetchUser()
    toast.success(next ? 'Бейдж обновлён' : 'Бейдж сброшен')
  } catch {
    badgeId.value = previous
    toast.error('Не удалось сохранить бейдж')
  } finally {
    pending.value = null
  }
}

onMounted(loadCustomization)
</script>

<template>
  <div class="flex flex-col gap-4 px-4 py-3">
    <div class="flex flex-col gap-2">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-sm">Рамка аватара</span>
        <span class="text-xs text-muted-foreground">
          {{ AVATAR_FRAMES.find((frame) => frame.id === frameId)?.title ?? 'Без рамки' }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="frame-none"
          :aria-pressed="frameId === null"
          :disabled="pending !== null || isLoading"
          :class="
            cn(
              'flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors hover:bg-accent/40 disabled:cursor-default disabled:opacity-60',
              frameId === null && 'border-foreground/40 bg-accent/30',
            )
          "
          @click="selectFrame(null)"
        >
          <UserAvatar :profile-image-url="user.profileImageUrl" :login="user.login" size="size-8" />
          <span class="flex min-w-0 flex-col">
            <span class="text-xs leading-tight">Без рамки</span>
            <span class="text-[10px] leading-tight text-muted-foreground">Аватар как есть</span>
          </span>
        </button>

        <button
          v-for="frame in AVATAR_FRAMES"
          :key="frame.id"
          type="button"
          :data-testid="`frame-${frame.id}`"
          :aria-pressed="frameId === frame.id"
          :aria-disabled="!unlockedFrames.has(frame.id)"
          :disabled="pending !== null || isLoading || !unlockedFrames.has(frame.id)"
          :title="unlockedFrames.has(frame.id) ? frame.description : frame.requirement"
          :class="
            cn(
              'flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors',
              unlockedFrames.has(frame.id)
                ? 'cursor-pointer hover:bg-accent/40 disabled:opacity-60'
                : 'cursor-default opacity-45',
              frameId === frame.id && 'border-foreground/40 bg-accent/30',
            )
          "
          @click="selectFrame(frame.id)"
        >
          <span class="relative shrink-0">
            <UserAvatar
              :profile-image-url="user.profileImageUrl"
              :login="user.login"
              :frame-id="frame.id"
              size="size-8"
            />
            <Lock
              v-if="!unlockedFrames.has(frame.id)"
              class="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-background p-[1px] text-muted-foreground"
              aria-hidden="true"
            />
          </span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="text-xs leading-tight">{{ frame.title }}</span>
            <span class="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
              {{ unlockedFrames.has(frame.id) ? frame.description : frame.requirement }}
            </span>
          </span>
          <Check
            v-if="frameId === frame.id"
            class="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-sm">Бейдж</span>
        <span class="text-xs text-muted-foreground">
          {{ USER_BADGES.find((badge) => badge.id === badgeId)?.title ?? 'Без бейджа' }}
        </span>
      </div>

      <div class="grid gap-1">
        <button
          type="button"
          data-testid="badge-none"
          :aria-pressed="badgeId === null"
          :disabled="pending !== null"
          :class="
            cn(
              'flex cursor-pointer items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/40 disabled:opacity-60',
              badgeId === null && 'border-foreground/40 bg-accent/30',
            )
          "
          @click="selectBadge(null)"
        >
          <span>Без бейджа</span>
          <Check v-if="badgeId === null" class="size-3.5 text-muted-foreground" />
        </button>

        <button
          v-for="badge in badges"
          :key="badge.id"
          type="button"
          :data-testid="`badge-${badge.id}`"
          :aria-pressed="badgeId === badge.id"
          :disabled="pending !== null"
          :class="
            cn(
              'flex cursor-pointer items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left transition-colors hover:bg-accent/40 disabled:opacity-60',
              badgeId === badge.id && 'border-foreground/40 bg-accent/30',
            )
          "
          @click="selectBadge(badge.id)"
        >
          <span class="flex min-w-0 items-center gap-2">
            <component :is="badge.icon" class="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span class="flex min-w-0 flex-col">
              <span class="text-sm leading-tight">{{ badge.title }}</span>
              <span class="text-xs leading-tight text-muted-foreground">
                {{ badge.description }}
              </span>
            </span>
          </span>
          <Check v-if="badgeId === badge.id" class="size-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  </div>
</template>
