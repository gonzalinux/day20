<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BottomNav from './BottomNav.vue'
import UsersPanel from './UsersPanel.vue'
import CalendarPanel from './CalendarPanel.vue'
import SettingsPanel from './SettingsPanel.vue'

type Panel = 'users' | 'calendar' | 'settings'

const props = defineProps<{
  users: { id: string; name: string; role: string }[]
  roomName: string
  currentUserId: string
  roomId: string
}>()

const emit = defineEmits<{
  'user-added': [user: { id: string; name: string; role: string }]
}>()

const activePanel = ref<Panel>('calendar')
const isDesktop = ref(false)

let mql: MediaQueryList | null = null

function onBreakpointChange(e: MediaQueryListEvent | MediaQueryList) {
  isDesktop.value = e.matches
}

onMounted(() => {
  mql = window.matchMedia('(min-width: 768px)')
  isDesktop.value = mql.matches
  mql.addEventListener('change', onBreakpointChange)
})

onUnmounted(() => {
  mql?.removeEventListener('change', onBreakpointChange)
})

const translateMap: Record<Panel, string> = {
  users: 'translateX(0%)',
  calendar: 'translateX(-33.333%)',
  settings: 'translateX(-66.666%)',
}

const trackStyle = computed(() => {
  if (isDesktop.value) return undefined
  return { transform: translateMap[activePanel.value] }
})
</script>

<template>
  <div class="flex-1 overflow-hidden flex flex-col">
    <!-- Sliding track (mobile) / Grid (desktop) -->
    <div
      class="flex w-[300%] flex-1 transition-transform duration-300 ease-in-out md:w-full md:grid md:grid-cols-[280px_1fr_280px] md:transition-none"
      :style="trackStyle"
    >
      <div class="w-1/3 md:w-full md:border-r md:border-secondary/20">
        <UsersPanel
          :users="users"
          :current-user-id="currentUserId"
          :room-id="roomId"
          @user-added="emit('user-added', $event)"
        />
      </div>
      <div class="w-1/3 md:w-full">
        <CalendarPanel />
      </div>
      <div class="w-1/3 md:w-full md:border-l md:border-secondary/20">
        <SettingsPanel />
      </div>
    </div>

    <!-- Bottom nav (mobile only) -->
    <BottomNav
      v-if="!isDesktop"
      :active-panel="activePanel"
      @select="activePanel = $event"
    />
  </div>
</template>
