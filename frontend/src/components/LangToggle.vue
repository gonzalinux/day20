<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

function toggle() {
  locale.value = locale.value === 'en' ? 'es' : 'en'
}
</script>

<template>
  <button
    @click="toggle"
    class="text-m text-primary hover:opacity-70 transition-opacity cursor-pointer flex font-semibold rounded-full border-2 size-10"
  >
    <span class="align-middle p-0 m-auto uppercase h-10 leading-11">{{
      locale === 'en' ? 'ES' : 'EN'
    }}</span>
  </button>
</template>
