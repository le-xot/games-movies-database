<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { prepareTelegramMiniApp } from '@/lib/telegram-webapp'
import WordlePlay from '@/pages/wordle/components/WordlePlay.vue'
import { ROUTER_PATHS } from '@/router/router-paths'
import { useUser } from '@/stores/use-user'

// Прямой заход без данных Telegram отсекает guard маршрута: сюда попадают
// только открытые из бота, но не прошедшие вход.
const user = useUser()
const { isLoggedIn, isPending } = storeToRefs(user)

const isRetrying = ref(false)

/**
 * Повторный вход после неудачи.
 *
 * `initData` от повтора не портится: Telegram разрешает проверять одну и ту же
 * строку до истечения её срока, так что достаточно ещё раз обменять её на cookie.
 */
async function retry() {
  if (isRetrying.value) return

  isRetrying.value = true
  try {
    await prepareTelegramMiniApp()
    await user.refetchUser()
  } finally {
    isRetrying.value = false
  }
}
</script>

<template>
  <div class="wordle-miniapp">
    <WordlePlay v-if="isLoggedIn" />

    <div v-else-if="!isPending" class="wordle-fallback">
      <p class="text-base font-medium">Не удалось подтвердить вход через Telegram</p>
      <p class="text-sm text-muted-foreground">
        Открой игру из бота — или продолжи на сайте, там всё то же самое.
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <Button :disabled="isRetrying" @click="retry">
          {{ isRetrying ? 'Проверяю…' : 'Повторить' }}
        </Button>
        <Button variant="secondary" as-child>
          <a :href="ROUTER_PATHS.wordle">Открыть на сайте</a>
        </Button>
      </div>
    </div>

    <Toaster />
  </div>
</template>

<style scoped>
/* Mini App сам себе оболочка: ни шапки, ни сайдбара, только доска и клавиатура.
   Отступы — под «чёлку» снизу у iPhone, её Telegram не компенсирует. */
/* Telegram кладёт в `--tg-viewport-stable-height` высоту окна без скачков при
   появлении нижней панели; вне Telegram остаётся 100dvh. */
.wordle-miniapp {
  display: flex;
  flex-direction: column;
  min-height: var(--tg-viewport-stable-height, 100dvh);
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
}

/* На сайте высота считается за вычетом шапки и паддингов контейнера — здесь их
   нет, поэтому отдаём почти весь экран игре. */
.wordle-miniapp :deep(.wordle-play) {
  min-height: calc(var(--tg-viewport-stable-height, 100dvh) - 60px);
}

.wordle-fallback {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}
</style>
