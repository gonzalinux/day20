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
