<script setup lang="ts">
import LoginForm from '@/components/form/login-form.vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTitle } from '@/composables/use-title'
import { useUser } from '@/composables/use-user'
import { ROUTER_PATHS } from '@/lib/router/router-paths.ts'
import { HouseIcon } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const { updateTitle } = useTitle()
const { isAdmin } = useUser()

const allRoutes = computed(() => [
  { name: 'Главная', icon: HouseIcon, path: ROUTER_PATHS.home },
  { name: 'Советы', path: ROUTER_PATHS.dbSuggestion },
  { name: 'Аукцион', path: ROUTER_PATHS.dbAuction, requiresAdmin: true },
  { name: 'Очередь', path: ROUTER_PATHS.dbQueue },
  { name: 'Игры', path: ROUTER_PATHS.dbGames },
  { name: 'Аниме', path: ROUTER_PATHS.dbAnime },
  { name: 'Фильмы', path: ROUTER_PATHS.dbMovie },
  { name: 'Сериалы', path: ROUTER_PATHS.dbSeries },
  { name: 'Мультфильмы', path: ROUTER_PATHS.dbCartoon },
])

const filteredRoutes = computed(() => {
  return allRoutes.value.filter(route => !route.requiresAdmin || isAdmin)
})

onMounted(() => {
  const routeData = allRoutes.value.find((item) => item.path === route.path)
  if (routeData) updateTitle(routeData.name)
})
</script>

<template>
  <div class="h-[68px] flex">
    <div class="flex justify-between items-center gap-8 p-4 w-full">
      <div class="flex flex-nowrap gap-2 items-center overflow-x-auto whitespace-nowrap">
        <div class="flex flex-row overflow-x-auto whitespace-nowrap h-[50px] w-full gap-2.5 items-center">
          <RouterLink
            v-for="headerRoute of filteredRoutes"
            v-slot="{ href, navigate }"
            :key="headerRoute.name"
            custom
            :to="headerRoute.path"
          >
            <Button
              :href="href"
              variant="secondary"
              :class="{ 'bg-[hsla(var(--primary-foreground))]': route.path === headerRoute.path }"
              @click="(event) => {
                navigate(event)
                updateTitle(headerRoute.name)
              }"
            >
              <component :is="headerRoute.icon" v-if="headerRoute.icon" />
              <template v-else>
                {{ headerRoute.name }}
              </template>
            </Button>
          </RouterLink>
        </div>
      </div>
      <LoginForm />
    </div>
  </div>
  <Separator />
</template>
