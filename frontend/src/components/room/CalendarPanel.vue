<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full p-8">
    <div class="rounded-2xl bg-secondary/20 shadow-lg p-8 text-center w-full max-w-2xl">
      <VIcon name="gi-calendar-half-year" class="text-accent mb-4" scale="3" />
      <h2 class="text-3xl font-heading font-bold text-accent mb-2">
        {{ t('room.calendarTitle') }}
      </h2>
      <p class="text-secondary">{{ t('room.calendarPlaceholder') }}</p>
    </div>
  </div>
</template>
