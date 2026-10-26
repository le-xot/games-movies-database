<script setup lang="ts">
import { AVATAR_FRAMES, USER_BADGES } from '@gmdb/contract'
import { Check } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import UserAvatar from '@/components/user/UserAvatar.vue'
import { assertOk } from '@/lib/api'
import { resolveBadge } from '@/lib/user-customization'
import { cn } from '@/lib/utils'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'
import type { UserEntity } from '@/lib/api'

/**
 * Выбор косметики профиля: рамка аватара и бейдж.
 *
 * Каталог берётся из `@gmdb/contract` (тот же, по которому валидирует бэкенд),
 * сохранение — сразу по клику: оптимистично правим локальное превью, затем
 * `refetchUser()`. Ошибка — откат и `toast`.
 */
const props = defineProps<{
  user: UserEntity
}>()

const api = useApi()
const userStore = useUser()

const frameId = ref<string | null>(props.user.avatarFrameId ?? null)
const badgeId = ref<string | null>(props.user.activeBadgeId ?? null)
const pending = ref<'frame' | 'badge' | null>(null)

// После `refetchUser()` (в том числе из других мест) превью догоняет сервер.
watch(
  () => [props.user.avatarFrameId, props.user.activeBadgeId] as const,
  ([frame, badge]) => {
    frameId.value = frame ?? null
    badgeId.value = badge ?? null
  },
)

const badges = computed(() =>
  USER_BADGES.map((badge) => ({ ...badge, icon: resolveBadge(badge.id)?.icon })),
)

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

      <div class="grid grid-cols-5 gap-2">
        <button
          type="button"
          data-testid="frame-none"
          :aria-pressed="frameId === null"
          aria-label="Без рамки"
          :disabled="pending !== null"
          :class="
            cn(
              'flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors hover:bg-accent/40 disabled:opacity-60',
              frameId === null && 'border-foreground/40 bg-accent/30',
            )
          "
          @click="selectFrame(null)"
        >
          <UserAvatar :profile-image-url="user.profileImageUrl" :login="user.login" size="size-8" />
          <span class="text-[10px] leading-tight text-muted-foreground">Нет</span>
        </button>

        <button
          v-for="frame in AVATAR_FRAMES"
          :key="frame.id"
          type="button"
          :data-testid="`frame-${frame.id}`"
          :aria-pressed="frameId === frame.id"
          :aria-label="frame.title"
          :title="frame.description"
          :disabled="pending !== null"
          :class="
            cn(
              'flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors hover:bg-accent/40 disabled:opacity-60',
              frameId === frame.id && 'border-foreground/40 bg-accent/30',
            )
          "
          @click="selectFrame(frame.id)"
        >
          <UserAvatar
            :profile-image-url="user.profileImageUrl"
            :login="user.login"
            :frame-id="frame.id"
            size="size-8"
          />
          <span class="text-[10px] leading-tight text-muted-foreground">{{ frame.title }}</span>
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
