<script setup lang="ts">
import { ref } from 'vue'
import BottomNav from './BottomNav.vue'
import UsersPanel from './UsersPanel.vue'
import CalendarPanel from './CalendarPanel.vue'
import SettingsPanel from './SettingsPanel.vue'

type Panel = 'users' | 'calendar' | 'settings'

const activePanel = ref<Panel>('calendar')
</script>

<template>
  <div class="flex-1 overflow-hidden flex flex-col">
    <!-- Sliding track (mobile) / Grid (desktop) -->
    <div
      class="flex w-[300%] flex-1 transition-transform duration-300 ease-in-out lg:w-full lg:grid lg:grid-cols-[280px_1fr_280px] lg:transition-none lg:translate-x-0"
      :class="{
        'translate-x-0': activePanel === 'users',
        '-translate-x-1/3': activePanel === 'calendar',
        '-translate-x-2/3': activePanel === 'settings',
      }"
    >
      <div class="w-1/3 lg:w-full lg:border-r lg:border-secondary/20">
        <UsersPanel />
      </div>
      <div class="w-1/3 lg:w-full">
        <CalendarPanel />
      </div>
      <div class="w-1/3 lg:w-full lg:border-l lg:border-secondary/20">
        <SettingsPanel />
      </div>
    </div>

    <!-- Bottom nav (mobile only) -->
    <BottomNav
      class="lg:hidden"
      :active-panel="activePanel"
      @select="activePanel = $event"
    />
  </div>
</template>
