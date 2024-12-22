<script lang="ts" setup>
import { ROUTER_PATHS } from '@/lib/router/router-paths'
import { useTitle } from '@vueuse/core'
import { onMounted } from 'vue'
import { SOCIAL_LINKS } from './constants/social-links'

const title = useTitle()
onMounted(() => title.value = 'le-xot.ru')
</script>

<template>
  <div class="container">
    <div class="container__items">
      <img
        class="logo"
        src="/images/lexot.webp"
        alt="Пажилой енот на своей даче под Рублевкой"
      >
      <div class="buttons__wrap">
        <div class="buttons">
          <a
            v-for="link in SOCIAL_LINKS"
            :key="link.name"
            :style="{ backgroundColor: link.color }"
            class="button"
            :href="link.url"
            target="_blank"
          >
            <component
              :is="link.icon"
              class="button__logo"
              size="32px"
            />
            <span class="button_text">{{ link.name }}</span>
          </a>
        </div>
        <router-link :to="ROUTER_PATHS.dbQueue" class="button button--large">
          Кладовка Лешота
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
body{
  background-color: rgb(24 24 28);
}
button {
  display: block;
  border: none;
  color: inherit;
  cursor: pointer;
}

.container {
  padding: 3rem;
  font-family: "Comfortaa", sans-serif;
  /* overflow: hidden; */
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  color: #ffffff;
}

.container__items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 25rem;
}

.logo {
  border-radius: 1rem;
  display: block;
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border: 2px solid #ffffff3e;
  /* fix pixelation */
  overflow-clip-margin: unset;
  flex-shrink: 0;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.buttons__wrap{
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.button {
  min-height: 52px;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 2rem;
  fill: #ffffff;
  padding: 0.5rem 1rem;
  background: #209852;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.025em;
  text-align: center;
  border-radius: 1rem;
  border: 2px solid #ffffff3e;
}
.buttons__wrap{
    width: 100%;
}

.button:hover {
  filter: brightness(85%);
}

.button--large {
  width: 100%;
}

.button_text {
  font-size: 1rem;
  text-align: center;
}

@media (max-width: 600px) {
  .container {
    padding: 2rem;
  }

  .container__items {
    gap: 0.5rem;
    max-width: 100%;
  }

  .logo {
    border-radius: 1rem;
  }

  .buttons {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .button {
    min-height: 52px;
    color: white;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 1rem;
    fill: #ffffff;
    padding: 0.5rem 1rem;
    background: #209852;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.025em;
    text-align: center;
    border-radius: 0.5rem;
    border: 2px solid #ffffff3e;
  }

  .button_text {
    font-size: 0.875rem;
  }
}

@media (height<= 760px) and (orientation: landscape) {
  .buttons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .container__items {
    max-width: 100%;
    flex-direction: row;
    align-items: center;
  }

  .logo {
    width: 50%;
  }
}
</style>
