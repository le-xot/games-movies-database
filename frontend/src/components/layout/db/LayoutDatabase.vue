<script setup lang="ts">
import Dialog from '@/components/dialog/Dialog.vue'
import LayoutBody from '@/components/layout/db/LayoutBody.vue'
import LayoutHeader from '@/components/layout/db/LayoutHeader.vue'
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
  height: 100%;
  scrollbar-width: none;
}
</style>
