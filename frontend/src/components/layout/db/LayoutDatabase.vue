<script setup lang="ts">
import { AccountDialog } from '@/components/account'
import Dialog from '@/components/dialog/Dialog.vue'
import { LoginDialog } from '@/components/form'
import LayoutBody from '@/components/layout/db/LayoutBody.vue'
import LayoutHeader from '@/components/layout/db/LayoutHeader.vue'
import LayoutSidebar from '@/components/layout/db/LayoutSidebar.vue'
</script>

<template>
  <div class="layout-database">
    <Dialog />
    <LoginDialog />
    <AccountDialog />
    <LayoutSidebar />
    <div class="layout-main">
      <LayoutHeader />
      <LayoutBody />
    </div>
  </div>
</template>

<style scoped>
.layout-database {
  display: flex;
  flex: 1;
  min-height: 0;
}

.layout-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
</style>
