<script lang="ts" setup>
import { ROUTER_PATHS } from '@/lib/router/router-paths.ts'
import { hardware } from '@/pages/pc/constants/parts-links.ts'
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'

const title = useTitle()
onMounted(() => title.value = 'Железки Лешота')
</script>

<template>
  <div class="container">
    <div>
      <template v-for="(parts, name) of hardware" :key="name">
        <h3 class="mt-8 mb-3 scroll-m-20 text-2xl font-semibold tracking-tight">
          {{ name }}
        </h3>
        <div class="buttons buttons--grid">
          <a
            v-for="link in parts"
            :key="link.name"
            class="button"
            :href="link.url"
            target="_blank"
          >
            <component :is="link.icon" class="button__logo" size="32px" />
            <span class="button_text">{{ link.name }}</span>
          </a>
        </div>
      </template>
      <div style="margin-top: 20px" class="buttons buttons--grid">
        <router-link
          class="button"
          style="background-color: #209852"
          :to="ROUTER_PATHS.db"
        >
          Назад
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 2rem;
  font-family: "Comfortaa", sans-serif;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  color: #ffffff;
}

.button {
  width: 100%;
  max-width: 500px;
  min-height: 36px;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 1rem;
  fill: #ffffff;
  padding: 0.4rem 1rem;
  background: #1f1f27;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.025em;
  text-align: center;
  border-radius: 0.8rem;
  border: 2px solid #ffffff3e;
}

.button__logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.buttons {
  display: grid;
  gap: 1.5rem;
}

/* Сетка адаптируется к ширине экрана */
.buttons--grid {
  grid-template-columns: repeat(1, 1fr); /* По умолчанию 1 столбец */
}

@media (min-width: 768px) {
  .buttons--grid {
    grid-template-columns: repeat(2, 1fr); /* Два столбца для среднего экрана */
  }
}

@media (min-width: 1200px) {
  .buttons--grid {
    grid-template-columns: repeat(3, 1fr); /* Три столбца для широких экранов */
  }
}
</style>
