<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'

const { t, locale } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6 text-center">
    <h1 class="font-heading font-bold text-primary text-8xl">404</h1>
    <p class="text-secondary text-xl">{{ t('notFound.message') }}</p>
    <RouterLink
      :to="localePath('/', locale)"
      class="bg-primary text-bg font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-heading"
    >
      {{ t('notFound.home') }}
    </RouterLink>
  </div>
</template>
