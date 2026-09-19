<script setup lang="ts">
import { Menu } from '@lucide/vue'
import { ref } from 'vue'
import { LoginForm } from '@/components/form'
import NavItem from '@/components/layout/db/NavItem.vue'
import { homeNavItem, useDbNavigation } from '@/components/layout/db/use-db-navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const { sections, handleNavClick } = useDbNavigation()
const isSheetOpen = ref(false)

function handleMobileNavClick(name: string) {
  handleNavClick(name)
  isSheetOpen.value = false
}
</script>

<template>
  <div class="h-[68px] flex border-b border-border bg-black z-[100] xl:hidden">
    <div class="flex justify-between items-center gap-2 p-3 w-full">
      <Sheet v-model:open="isSheetOpen">
        <Button
          variant="secondary"
          size="icon"
          class="shrink-0"
          @click="isSheetOpen = !isSheetOpen"
        >
          <Menu class="w-5 h-5" />
        </Button>
        <SheetContent side="left" class="w-[260px]">
          <SheetHeader>
            <SheetTitle class="select-none">Навигация</SheetTitle>
          </SheetHeader>
          <div class="flex flex-col gap-2 mt-8">
            <template v-for="(section, i) in sections" :key="i">
              <NavItem
                v-for="item in section.items"
                :key="item.name"
                :item="item"
                @select="handleMobileNavClick"
              />
              <Separator v-if="i < sections.length - 1" class="my-2" />
            </template>
            <Separator class="my-2" />
            <NavItem :item="homeNavItem" @select="handleMobileNavClick" />
          </div>
        </SheetContent>
      </Sheet>

      <LoginForm />
    </div>
  </div>
</template>
