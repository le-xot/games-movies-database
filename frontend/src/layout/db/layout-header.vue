<script setup lang="ts">
import LoginForm from '@/components/form/login-form.vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTitle } from '@/composables/use-title'
import { ROUTER_PATHS } from '@/lib/router/router-paths.ts'
import { onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const { updateTitle } = useTitle()

const routes = [
  { name: 'Главная', path: ROUTER_PATHS.home },
  { name: 'Очередь', path: ROUTER_PATHS.dbQueue },
  { name: 'Игры', path: ROUTER_PATHS.dbGames },
  { name: 'Кино', path: ROUTER_PATHS.dbVideos },
  { name: 'Железки', path: ROUTER_PATHS.pc },
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
        <div class="header-nav">
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
              {{ headerRoute.name }}
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
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.active {
  background-color: hsla(var(--primary-foreground));
}
</style>
