<script lang="ts" setup>
import { Cpu, Gamepad2, Monitor, ShieldCheck } from '@lucide/vue'
import { useTitle } from '@vueuse/core'
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { hardware } from '@/pages/pc/constants/parts-links'
import { ROUTER_PATHS } from '@/router/router-paths'

const title = useTitle()

const osParts = hardware['Операционные системы']
const systemParts = hardware.Железки
const monitorParts = hardware.Мониторы
const deviceParts = hardware.Девайсы

const gadgetParts = deviceParts.filter((part) => /Pixel|Switch|8BitDo/i.test(part.name))
const workspaceParts = [
  ...monitorParts,
  ...deviceParts.filter((part) => !/Pixel|Switch|8BitDo/i.test(part.name)),
]

const categoryCards = computed(() => [
  {
    name: 'ПК',
    kicker: 'MAIN SETUP',
    icon: Cpu,
    parts: systemParts,
  },
  {
    name: 'Рабочее место',
    kicker: 'DESK SETUP',
    icon: Monitor,
    parts: workspaceParts,
  },
  {
    name: 'Гаджеты',
    kicker: 'PORTABLE',
    icon: Gamepad2,
    parts: gadgetParts,
  },
  {
    name: 'ОС',
    kicker: 'SOFTWARE',
    icon: ShieldCheck,
    parts: osParts,
  },
])

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast('Скопировано', { description: text })
  } catch (error) {
    console.error('Failed to copy text:', error)
    toast.error('Не удалось скопировать', { description: text })
  }
}

onMounted(() => {
  title.value = 'Сетап Лешота'
})
</script>

<template>
  <div class="min-h-screen bg-background font-mono text-foreground">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:gap-8 sm:px-6 sm:py-6 lg:px-8">
      <RouterLink
        :to="ROUTER_PATHS.home"
        class="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span class="text-primary">←</span>
        На главную
      </RouterLink>

      <header class="text-2xl font-semibold tracking-tight sm:text-5xl">
        <span class="text-muted-foreground">~/$</span> setup
      </header>

      <section class="grid gap-4 sm:gap-6 md:grid-cols-2">
        <article
          v-for="card in categoryCards"
          :key="card.name"
          class="flex flex-col rounded-md border border-border/50 bg-muted/30"
        >
          <div class="border-b border-border/50 px-3 py-3 sm:px-5 sm:py-4">
            <div class="flex items-baseline gap-3">
              <span class="text-lg font-semibold text-primary sm:text-xl">&gt; {{ card.name }}_</span>
              <span class="text-xs tracking-widest text-muted-foreground uppercase sm:text-sm">
                {{ card.kicker }}
              </span>
            </div>
          </div>

          <div class="px-2 py-2 sm:px-3 sm:py-3">
            <button
              v-for="(part, index) in card.parts"
              :key="part.name"
              type="button"
              class="group flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3 sm:px-3 sm:py-2 sm:text-base"
              :aria-label="`Скопировать ${part.name}`"
              @click="copyText(part.name)"
            >
              <span class="hidden w-7 shrink-0 text-center text-lg text-muted-foreground sm:inline">
                {{ index === card.parts.length - 1 ? '└──' : '├──' }}
              </span>
              <component
                :is="typeof part.icon === 'string' ? 'img' : part.icon"
                :src="typeof part.icon === 'string' ? part.icon : undefined"
                class="size-4 shrink-0 text-muted-foreground sm:size-5"
              />
              <span class="truncate">{{ part.name }}</span>
            </button>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>
