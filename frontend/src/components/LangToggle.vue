<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'

const { locale } = useI18n()
const router = useRouter()
const route = useRoute()

function toggle() {
  if (locale.value === 'en') {
    // English → Spanish: prepend /es
    router.push(`/es${route.fullPath}`)
  } else {
    // Spanish → English: strip /es prefix
    const path = route.fullPath.replace(/^\/es/, '') || '/'
    router.push(path)
  }
}

defineExpose({ toggle })
</script>

<template>
  <button
    @click="toggle"
    :aria-label="locale === 'en' ? 'Switch to Spanish' : 'Cambiar a inglés'"
    class="text-xs text-primary hover:opacity-70 transition-opacity cursor-pointer flex font-semibold rounded-full border-2 size-8"
  >
    <span class="align-middle p-0 m-auto uppercase h-8 leading-9">{{
      locale === 'en' ? 'ES' : 'EN'
    }}</span>
  </button>
</template>
