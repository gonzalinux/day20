<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type Panel = 'users' | 'calendar' | 'settings'

defineProps<{
  activePanel: Panel
}>()

const emit = defineEmits<{
  select: [panel: Panel]
}>()

const { t } = useI18n()

const tabs: { panel: Panel; icon: string; labelKey: string }[] = [
  { panel: 'users', icon: 'gi-tabletop-players', labelKey: 'room.navUsers' },
  { panel: 'calendar', icon: 'gi-calendar-half-year', labelKey: 'room.navCalendar' },
  { panel: 'settings', icon: 'gi-cog', labelKey: 'room.navSettings' },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-secondary/20">
    <div class="flex justify-around">
      <button
        v-for="tab in tabs"
        :key="tab.panel"
        class="flex flex-col items-center py-2 px-4 flex-1 cursor-pointer transition-colors"
        :class="activePanel === tab.panel ? 'text-accent' : 'text-secondary/60'"
        @click="emit('select', tab.panel)"
      >
        <VIcon :name="tab.icon" scale="1.4" />
        <span class="text-xs mt-1 font-heading">{{ t(tab.labelKey) }}</span>
      </button>
    </div>
  </nav>
</template>
