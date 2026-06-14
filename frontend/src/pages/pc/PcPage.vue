<script lang="ts" setup>
import { Cpu, Gamepad2, Monitor, ShieldCheck, Undo2Icon } from '@lucide/vue'
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
    kicker: 'Main setup',
    note: 'Плата, CPU, GPU, память, питание, охлаждение и накопители.',
    icon: Cpu,
    parts: systemParts,
  },
  {
    name: 'Рабочее место',
    kicker: 'Desk setup',
    note: 'Мониторы, микрофон, наушники, камера, мышь, клавиатура и пантограф.',
    icon: Monitor,
    parts: workspaceParts,
  },
  {
    name: 'Гаджеты',
    kicker: 'Portable',
    note: 'Телефон, консоль и остальное портативное железо.',
    icon: Gamepad2,
    parts: gadgetParts,
  },
  {
    name: 'ОС',
    kicker: 'Software',
    note: 'Система, на которой я работаю каждый день.',
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
  <div class="min-h-screen bg-background text-foreground">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      <RouterLink
        :to="ROUTER_PATHS.home"
        class="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Undo2Icon class="size-4" />
        На главную
      </RouterLink>

      <header>
        <h1 class="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Мой сетап: ПК, рабочее место, гаджеты и ОС.
        </h1>
      </header>

      <section class="grid gap-x-5 gap-y-8 md:grid-cols-2 md:gap-y-10">
        <article
          v-for="card in categoryCards"
          :key="card.name"
          class="flex flex-col gap-5 rounded-[28px] px-1 py-2 sm:px-2 sm:py-3"
        >
          <div class="space-y-3 px-4 sm:px-3">
            <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">
              {{ card.name }}
            </h2>

            <div class="h-px w-full bg-border/70" />
          </div>

          <div class="space-y-2">
            <button
              v-for="part in card.parts"
              :key="part.name"
              type="button"
              class="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border/60 bg-background/45 px-4 py-3 text-left transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :aria-label="`Скопировать ${part.name}`"
              @click="copyText(part.name)"
            >
              <span
                class="flex min-w-0 items-center gap-3 text-base font-medium leading-6 text-foreground sm:text-lg"
              >
                <component
                  :is="typeof part.icon === 'string' ? 'img' : part.icon"
                  :src="typeof part.icon === 'string' ? part.icon : undefined"
                  class="size-4 shrink-0 text-muted-foreground"
                />
                <span class="truncate">{{ part.name }}</span>
              </span>
            </button>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>
