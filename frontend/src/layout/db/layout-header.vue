<script setup lang="ts">
import LoginForm from '@/components/form/login-form.vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTitle } from '@/composables/use-title'
import { useUser } from '@/composables/use-user'
import { ROUTER_PATHS } from '@/lib/router/router-paths.ts'
import { Baby, Film, Gamepad2, Gavel, HandPlatter, HouseIcon, JapaneseYen, ListOrdered, Popcorn } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

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
  { name: 'Главная', icon: HouseIcon, path: ROUTER_PATHS.home, group: 1 },
  { name: 'Советы', icon: HandPlatter, path: ROUTER_PATHS.dbSuggestion, group: 2 },
  { name: 'Аукцион', icon: Gavel, path: ROUTER_PATHS.dbAuction, group: 2, requiresAdmin: true },
  { name: 'Очередь', icon: ListOrdered, path: ROUTER_PATHS.dbQueue, group: 2 },
  { name: 'Игры', icon: Gamepad2, path: ROUTER_PATHS.dbGames, group: 3 },
  { name: 'Аниме', icon: JapaneseYen, path: ROUTER_PATHS.dbAnime, group: 3 },
  { name: 'Фильмы', icon: Film, path: ROUTER_PATHS.dbMovie, group: 3 },
  { name: 'Сериалы', icon: Popcorn, path: ROUTER_PATHS.dbSeries, group: 3 },
  { name: 'Мультфильмы', icon: Baby, path: ROUTER_PATHS.dbCartoon, group: 3 },
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
  <div class="h-[68px] flex">
    <div class="flex justify-between items-center gap-8 p-4 w-full">
      <div class="flex gap-2 overflow-x-auto h-[50px] items-center">
        <template v-for="(group, i) in groupedRoutes" :key="i">
          <RouterLink
            v-for="r in group"
            :key="r.name"
            :to="r.path"
          >
            <Button
              variant="secondary"
              :class="{ 'bg-[hsla(var(--primary-foreground))]': route.path === r.path }"
              @click="() => updateTitle(r.name)"
            >
              <div class="flex items-center gap-1.5">
                <component :is="r.icon" class="w-4 h-4" />
                <span>{{ r.name }}</span>
              </div>
            </Button>
          </RouterLink>
          <Separator v-if="i < groupedRoutes.length - 1" orientation="vertical" class="mx-2" />
        </template>
      </div>
      <LoginForm />
    </div>
  </div>
  <Separator />
</template>
