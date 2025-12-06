<script setup lang="ts">
import LoginForm from "@/components/form/login-form.vue"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTitle } from "@/composables/use-title"
import { useUser } from "@/composables/use-user"
import { ROUTER_PATHS } from "@/lib/router/router-paths.ts"
import {
  Baby,
  Film,
  Gamepad2,
  Gavel,
  HandPlatter,
  HouseIcon,
  JapaneseYen,
  ListOrdered,
  Popcorn,
} from "lucide-vue-next"
import { computed, onMounted } from "vue"
import { RouterLink, useRoute } from "vue-router"

const route = useRoute()
const { updateTitle } = useTitle()
const { isAdmin } = useUser()

interface RouteItem {
  name: string
  icon: any
  path: string
  group: number
  requiresAdmin?: boolean
}

const allRoutes: RouteItem[] = [
  { name: "Главная", icon: HouseIcon, path: ROUTER_PATHS.home, group: 1 },
  {
    name: "Советы",
    icon: HandPlatter,
    path: ROUTER_PATHS.dbSuggestion,
    group: 2,
  },
  {
    name: "Аукцион",
    icon: Gavel,
    path: ROUTER_PATHS.dbAuction,
    group: 2,
    requiresAdmin: true,
  },
  { name: "Очередь", icon: ListOrdered, path: ROUTER_PATHS.dbQueue, group: 2 },
  { name: "Игры", icon: Gamepad2, path: ROUTER_PATHS.dbGames, group: 3 },
  { name: "Аниме", icon: JapaneseYen, path: ROUTER_PATHS.dbAnime, group: 3 },
  { name: "Фильмы", icon: Film, path: ROUTER_PATHS.dbMovie, group: 3 },
  { name: "Сериалы", icon: Popcorn, path: ROUTER_PATHS.dbSeries, group: 3 },
  { name: "Мультфильмы", icon: Baby, path: ROUTER_PATHS.dbCartoon, group: 3 },
]

const groupedRoutes = computed(() => {
  const map = new Map<number, RouteItem[]>()
  allRoutes
    .filter(r => !r.requiresAdmin || isAdmin)
    .forEach(r => {
      const group = map.get(r.group) ?? []
      group.push(r)
      map.set(r.group, group)
    })
  return [...map.values()]
})

onMounted(() => {
  const current = allRoutes.find(r => r.path === route.path)
  if (current) updateTitle(current.name)
})
</script>

<template>
  <div
    class="h-[68px] flex sticky top-0 border-b border-border bg-black z-[100]"
  >
    <div class="flex justify-between items-center gap-4 xl:gap-8 p-4 w-full">
      <div class="flex gap-1 xl:gap-2 h-[50px] items-center">
        <template v-for="(group, i) in groupedRoutes" :key="i">
          <RouterLink v-for="r in group" :key="r.name" :to="r.path">
            <Button
              variant="secondary"
              class="nav-button-animation px-2.5 xl:px-4"
              :class="{
                'bg-primary text-primary-foreground hover:bg-primary/70': route.path === r.path,
              }"
              @click="() => updateTitle(r.name)"
            >
              <component :is="r.icon" class="w-4 h-4" />
              <div class="nav-text-container">
                <span class="nav-text whitespace-nowrap">{{ r.name }}</span>
              </div>
            </Button>
          </RouterLink>
          <Separator
            v-if="i < groupedRoutes.length - 1"
            orientation="vertical"
            class="nav-delay-animation mx-0.5 xl:mx-2 h-1/2"
          />
        </template>
      </div>
      <LoginForm />
    </div>
  </div>
</template>

<style scoped>
.nav-button-animation {
  display: flex;
  align-items: center;
  gap: 0;
  transition:
    padding 200ms ease-out,
    background-color 200ms ease-out,
    gap 200ms ease-out 200ms;
}

.nav-text-container {
  overflow: hidden;
  max-width: 0;
  transition: max-width 200ms ease-out;
}

.nav-text {
  opacity: 0;
  transition: opacity 200ms ease-out 200ms;
}

@media (min-width: 1280px) {
  .nav-button-animation {
    gap: 0.375rem;
    transition:
      padding 200ms ease-out,
      background-color 200ms ease-out,
      gap 200ms ease-out;
  }

  .nav-text-container {
    max-width: 200px;
  }

  .nav-text {
    opacity: 1;
    transition: opacity 200ms ease-out;
  }
}

.nav-delay-animation {
  transition: margin 200ms ease-out 200ms;
}

@media (min-width: 1280px) {
  .nav-delay-animation {
    transition: margin 200ms ease-out;
  }
}
</style>
