<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import BottomNav from './BottomNav.vue'
import UsersPanel from './UsersPanel.vue'
import CalendarPanel from './CalendarPanel.vue'
import SettingsPanel from './SettingsPanel.vue'
import { useRoomStore } from '@/stores/room'

type Panel = 'users' | 'calendar' | 'settings'
type CalendarTab = 'weekly' | 'overrides' | 'combined'

const activePanel = ref<Panel>('calendar')
const calendarTab = ref<CalendarTab>('weekly')
const room = useRoomStore()

let pollInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  pollInterval = setInterval(() => room.fetchUsers(), 5000)
})
onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

function openCombined() {
  calendarTab.value = 'combined'
  activePanel.value = 'calendar'
}
</script>

<template>
  <div class="flex-1 overflow-hidden flex flex-col w-full">
    <!-- Sliding track (mobile) / Grid (desktop) -->
    <div
      class="flex w-[300%] flex-1 min-h-0 transition-transform duration-300 ease-in-out lg:w-full lg:grid lg:grid-cols-[280px_1fr_280px] lg:transition-none lg:translate-x-0"
      :class="{
        'translate-x-0': activePanel === 'users',
        '-translate-x-1/3': activePanel === 'calendar',
        '-translate-x-2/3': activePanel === 'settings',
      }"
    >
      <div class="w-1/3 h-full overflow-hidden lg:w-full lg:border-r lg:border-secondary/20">
        <UsersPanel @open-combined="openCombined" />
      </div>
      <div class="w-1/3 h-full overflow-hidden lg:w-full">
        <CalendarPanel :initial-tab="calendarTab" @update:tab="calendarTab = $event" />
      </div>
      <div class="w-1/3 h-full overflow-hidden lg:w-full lg:border-l lg:border-secondary/20">
        <SettingsPanel />
      </div>
    </div>

    <!-- Bottom nav (mobile only) -->
    <BottomNav class="lg:hidden" :active-panel="activePanel" @select="activePanel = $event" />
  </div>
</template>
