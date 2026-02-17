<script setup lang="ts">
import { ref, onMounted } from 'vue'

const dark = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) {
    dark.value = saved === 'dark'
  } else {
    dark.value = document.documentElement.classList.contains('dark')
  }
  document.documentElement.classList.toggle('dark', dark.value)
})

function toggle() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  localStorage.setItem('theme', dark.value ? 'dark' : 'light')
}

defineExpose({ toggle })
</script>

<template>
  <button
    @click="toggle"
    aria-label="Toggle dark mode"
    class="text-primary hover:opacity-70 transition-opacity cursor-pointer rounded-full border-2 size-8"
  >
    <VIcon class="size-7 p-0 m-0" :name="dark ? 'gi-sunrise' : 'gi-moon-bats'" scale="1.5" />
  </button>
</template>
