<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { RouteItem } from '@/components/layout/db/use-db-navigation'

defineProps<{
  item: RouteItem
  collapsed?: boolean
}>()

defineEmits<{ select: [name: string] }>()

const route = useRoute()
</script>

<template>
  <TooltipProvider :delay-duration="100">
    <Tooltip :disabled="!collapsed">
      <TooltipTrigger as-child>
        <RouterLink :to="item.path" class="block">
          <Button
            variant="ghost"
            class="w-full hover:bg-white/10"
            :class="[
              collapsed ? 'justify-center px-0' : 'justify-start gap-3 px-2',
              route.path === item.path
                ? 'bg-primary text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground'
                : '',
            ]"
            @click="$emit('select', item.name)"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0" />
            <span v-if="!collapsed" class="truncate">{{ item.name }}</span>
          </Button>
        </RouterLink>
      </TooltipTrigger>
      <TooltipContent side="right">{{ item.name }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
