<script setup lang="ts">
import { LibraryBig, PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { LoginForm } from '@/components/form'
import NavItem from '@/components/layout/db/NavItem.vue'
import { useDbNavigation } from '@/components/layout/db/use-db-navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const { sections, bottomItems, handleNavClick } = useDbNavigation()
const collapsed = useStorage('db-sidebar-collapsed', false)
</script>

<template>
  <aside
    class="hidden xl:flex flex-col shrink-0 border-r border-border bg-black transition-[width] duration-200 ease-out"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <div
      class="flex items-center gap-2 p-3"
      :class="collapsed ? 'justify-center' : 'justify-between'"
    >
      <div v-if="!collapsed" class="flex min-w-0 translate-y-[2px] items-center gap-2 px-2">
        <LibraryBig class="size-6 shrink-0 text-green-500" />
        <span class="truncate text-base font-semibold">Кладовка</span>
      </div>
      <TooltipProvider :delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="shrink-0"
              :aria-label="collapsed ? 'Развернуть меню' : 'Свернуть меню'"
              @click="collapsed = !collapsed"
            >
              <PanelLeftOpen v-if="collapsed" />
              <PanelLeftClose v-else />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ collapsed ? 'Развернуть' : 'Свернуть' }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <Separator class="my-2" />

    <div class="px-3">
      <LoginForm :collapsed="collapsed" />
    </div>

    <Separator class="my-2" />

    <nav class="flex flex-1 min-h-0 flex-col gap-1 overflow-y-auto py-1">
      <template v-for="(section, i) in sections" :key="i">
        <div class="flex flex-col gap-1 px-3">
          <NavItem
            v-for="item in section.items"
            :key="item.name"
            :item="item"
            :collapsed="collapsed"
            @select="handleNavClick"
          />
        </div>
        <Separator v-if="i < sections.length - 1" class="my-2" />
      </template>
    </nav>

    <div class="flex flex-col gap-1 border-t border-border p-3">
      <NavItem
        v-for="item in bottomItems"
        :key="item.name"
        :item="item"
        :collapsed="collapsed"
        @select="handleNavClick"
      />
    </div>
  </aside>
</template>
