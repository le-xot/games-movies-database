<script setup lang="ts">
import { ChevronRight, LogOutIcon } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AccountAvatarRow from '@/components/account/AccountAvatarRow.vue'
import AccountDangerZone from '@/components/account/AccountDangerZone.vue'
import AccountHeader from '@/components/account/AccountHeader.vue'
import AccountNickname from '@/components/account/AccountNickname.vue'
import ConnectedAccounts from '@/components/account/ConnectedAccounts.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogScrollContent, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { ROUTER_PATHS } from '@/router/router-paths'
import { ACCOUNT_DIALOG_ON_LOAD_KEY, useAccountDialog } from '@/stores/use-account-dialog'
import { useUser } from '@/stores/use-user'

const accountDialog = useAccountDialog()
const userStore = useUser()
const { user, editorEnabled, isRealAdmin } = storeToRefs(userStore)
const router = useRouter()

onMounted(() => {
  if (sessionStorage.getItem(ACCOUNT_DIALOG_ON_LOAD_KEY) === '1') {
    sessionStorage.removeItem(ACCOUNT_DIALOG_ON_LOAD_KEY)
    accountDialog.openAccount()
  }
})

function goToAdmin() {
  accountDialog.closeAccount()
  router.push(ROUTER_PATHS.admin)
}

async function logout() {
  await userStore.userLogout()
  accountDialog.closeAccount()
  router.push(ROUTER_PATHS.dbSuggestion)
}
</script>

<template>
  <Dialog v-model:open="accountDialog.isOpen">
    <DialogScrollContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Аккаунт</DialogTitle>
      </DialogHeader>

      <AccountHeader v-if="user" :user="user" />

      <div class="overflow-hidden rounded-lg border">
        <AccountNickname v-if="user" />

        <template v-if="user?.hasCustomAvatar">
          <div class="h-px bg-border" />
          <AccountAvatarRow />
        </template>

        <template v-if="isRealAdmin">
          <div class="h-px bg-border" />
          <div class="flex items-center justify-between gap-3 px-4 py-3">
            <span class="text-sm">Редактор</span>
            <Switch :model-value="editorEnabled" @update:model-value="editorEnabled = $event" />
          </div>
          <div class="h-px bg-border" />
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
            @click="goToAdmin"
          >
            <span class="text-sm">Админка</span>
            <ChevronRight class="size-4 text-muted-foreground" />
          </button>
        </template>
      </div>

      <ConnectedAccounts />

      <Button variant="outline" class="w-full" @click="logout">
        <LogOutIcon class="size-4 mr-2" />
        Выйти
      </Button>

      <AccountDangerZone v-if="user" />
    </DialogScrollContent>
  </Dialog>
</template>
