<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { resolveFrame } from '@/lib/user-customization'
import { cn } from '@/lib/utils'
import type { AvatarVariants } from '@/components/ui/avatar'
import type { HTMLAttributes } from 'vue'

/**
 * Аватар пользователя вместе с косметической рамкой.
 *
 * `Avatar` из `components/ui` намеренно остаётся нейтральной shadcn-обёрткой:
 * рамка живёт здесь слоем снаружи, поэтому работает в любом размере и не
 * трогает сам примитив. Размер задаётся классом (`size-10`, `size-16`, …) —
 * от него же зависит толщина кольца, чтобы 16-пиксельному аватару не досталось
 * кольцо шире самого аватара.
 */
const props = withDefaults(
  defineProps<{
    profileImageUrl: string
    login: string
    /** id рамки из каталога `@gmdb/contract`; неизвестный или `null` — без рамки. */
    frameId?: string | null
    /** Класс размера, например `size-10`. */
    size?: string
    shape?: AvatarVariants['shape']
    fallbackClass?: HTMLAttributes['class']
    class?: HTMLAttributes['class']
  }>(),
  {
    frameId: null,
    size: 'size-10',
    shape: 'circle',
    fallbackClass: undefined,
    class: undefined,
  },
)

const frame = computed(() => resolveFrame(props.frameId))

const frameShape = computed(() => (props.shape === 'square' ? 'rounded-md' : 'rounded-full'))

const ringPadding = computed(() => {
  const match = /(?:^|\s)size-(\d+(?:\.\d+)?)/.exec(props.size)
  const px = match ? Number(match[1]) * 4 : 40

  if (px >= 48) return 'p-[3px]'
  if (px >= 32) return 'p-0.5'
  return 'p-[1.5px]'
})

const initial = computed(() => props.login.charAt(0).toUpperCase())
</script>

<template>
  <span
    :data-frame="frame?.id"
    :class="
      cn(
        'relative inline-flex shrink-0',
        size,
        frameShape,
        frame && [frame.ringClassName, frame.glowClassName, ringPadding],
        props.class,
      )
    "
  >
    <Avatar :shape="shape" class="size-full">
      <AvatarImage :src="profileImageUrl" :alt="login" />
      <AvatarFallback :class="fallbackClass">{{ initial }}</AvatarFallback>
    </Avatar>
  </span>
</template>
