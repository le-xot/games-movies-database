<script setup lang="ts">
import { AVATAR_FRAMES } from '@gmdb/contract'
import { Check, Lock } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import UserAvatar from '@/components/user/UserAvatar.vue'
import { assertOk, unwrap } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useApi } from '@/stores/use-api'
import { useUser } from '@/stores/use-user'
import type { UserEntity } from '@/lib/api'

/**
 * Выбор рамки аватара.
 *
 * Рамки — чекпоинты: условие достаточно выполнить один раз, после этого рамка
 * открыта навсегда. Список открытых отдаёт `GET /auth/me/customization` (он же
 * досчитывает только что заработанное), у заблокированных показываем условие.
 */
const props = defineProps<{
  user: UserEntity
}>()

const api = useApi()
const userStore = useUser()

const frameId = ref<string | null>(props.user.avatarFrameId ?? null)
const unlockedFrameIds = ref<string[]>([])
const isLoading = ref(true)
const isSaving = ref(false)

const unlockedFrames = computed(() => new Set(unlockedFrameIds.value))

// После `refetchUser()` (в том числе из других мест) превью догоняет сервер.
watch(
  () => props.user.avatarFrameId,
  (frame) => {
    frameId.value = frame ?? null
  },
)

async function loadCustomization() {
  try {
    const state = await unwrap(api.auth.me.customization.get())
    frameId.value = state.avatarFrameId ?? null
    unlockedFrameIds.value = state.unlockedAvatarFrameIds
  } catch {
    toast.error('Не удалось загрузить рамки профиля')
  } finally {
    isLoading.value = false
  }
}

async function selectFrame(next: string | null) {
  if (isSaving.value) return

  const previous = frameId.value
  frameId.value = next
  isSaving.value = true

  try {
    await assertOk(api.auth.me.customization.patch({ avatarFrameId: next }))
    await userStore.refetchUser()
    toast.success(next ? 'Рамка обновлена' : 'Рамка сброшена')
  } catch {
    frameId.value = previous
    toast.error('Не удалось сохранить рамку')
  } finally {
    isSaving.value = false
  }
}

onMounted(loadCustomization)
</script>

<template>
  <div class="flex flex-col gap-2 px-4 py-3">
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
        :disabled="isSaving || isLoading"
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
        :disabled="isSaving || isLoading || !unlockedFrames.has(frame.id)"
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
</template>
