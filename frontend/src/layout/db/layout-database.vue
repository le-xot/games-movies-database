<script setup lang="ts">
import Dialog from '@/components/dialog/dialog.vue'
import LayoutBody from '@/layout/db/layout-body.vue'
import LayoutHeader from '@/layout/db/layout-header.vue'
</script>

<template>
  <div class="layout-database">
    <Dialog />
    <LayoutHeader />
    <LayoutBody />
  </div>
</template>

<style scoped>
.layout-database {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  overflow: auto;
  scrollbar-width: none;
}
</style>
