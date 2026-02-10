<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'

const { t } = useI18n()
</script>

<template>
  <div class="h-full p-4 overflow-y-auto">
    <h2 class="text-xl font-heading font-bold text-accent mb-4">
      {{ t('room.navSettings') }}
    </h2>
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between px-4 py-2 rounded-lg bg-bg/50">
        <span class="text-primary font-body">{{ t('room.settingsTheme') }}</span>
        <ThemeToggle />
      </div>
      <div class="flex items-center justify-between px-4 py-2 rounded-lg bg-bg/50">
        <span class="text-primary font-body">{{ t('room.settingsLang') }}</span>
        <LangToggle />
      </div>
    </div>
  </div>
</template>
