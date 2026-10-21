<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import { provideScrollContainer } from '@/composables/use-scroll-container'

const route = useRoute()
const bodyRef = ref<HTMLElement | null>(null)

provideScrollContainer(bodyRef)

// Контейнер скроллится не окном, поэтому scrollBehavior роутера его не трогает.
watch(
  () => route.fullPath,
  () => bodyRef.value?.scrollTo({ top: 0 }),
  { flush: 'post' },
)
</script>

<template>
  <div ref="bodyRef" class="body">
    <div class="body-content relative">
      <Toaster />
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="page" mode="out-in">
          <!-- pageKey держит один компонент при переключении жанров внутри MediaPage. -->
          <component :is="Component" :key="currentRoute.meta.pageKey ?? currentRoute.path" />
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

<style>
/* Плавная смена страниц: старая исчезает сразу, новая проявляется. */
.page-enter-active {
  transition: opacity 140ms ease;
}

.page-enter-from {
  opacity: 0;
}

.page-leave-active {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>

<style scoped>
.body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scrollbar-width: auto;
  scrollbar-color: oklch(0.4 0 0) transparent;
}

.body-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}
</style>
