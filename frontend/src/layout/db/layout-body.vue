<template>
  <div class="body">
    <RouterView />
  </div>
</template>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  scrollbar-width: none;
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}
</style>
