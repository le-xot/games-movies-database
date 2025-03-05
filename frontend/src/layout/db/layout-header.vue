<script setup lang="ts">
import LoginForm from '@/components/form/login-form.vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTitle } from '@/composables/use-title'
import { ROUTER_PATHS } from '@/lib/router/router-paths.ts'
import { HouseIcon } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const { updateTitle } = useTitle()

const routes = [
  { name: 'Главная', icon: HouseIcon, path: ROUTER_PATHS.home },
  { name: 'Очередь', path: ROUTER_PATHS.dbQueue },
  { name: 'Игры', path: ROUTER_PATHS.dbGames },
  { name: 'Аниме', path: ROUTER_PATHS.dbAnime },
  { name: 'Фильмы', path: ROUTER_PATHS.dbMovie },
  { name: 'Сериалы', path: ROUTER_PATHS.dbSeries },
  { name: 'Мультфильмы', path: ROUTER_PATHS.dbCartoon },
]

onMounted(() => {
  const routeData = routes.find((item) => item.path === route.path)
  if (routeData) updateTitle(routeData.name)
})
</script>

<template>
  <div class="header">
    <div class="header-container">
      <div class="header-nav">
        <div class="button-container">
          <RouterLink
            v-for="headerRoute of routes"
            v-slot="{ href, navigate }"
            :key="headerRoute.name"
            custom
            :to="headerRoute.path"
          >
            <Button
              :href="href"
              variant="secondary"
              :class="{ active: route.path === headerRoute.path }"
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

<style scoped>
.header {
  height: 68px;
  display: flex;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1rem;
  width: 100%;
}

.header-nav {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
}

.active {
  background-color: hsla(var(--primary-foreground));
}

.button-container {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  white-space: nowrap;
  height: 50px;
  width: 100%;
  gap: 10px;
  align-items: center;
}

router-link {
  flex-shrink: 0;
}
</style>
