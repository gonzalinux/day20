<script setup lang="ts">
import { ref, onMounted } from 'vue'

const dark = ref(false)

onMounted(() => {
  dark.value = document.documentElement.classList.contains('dark')
})

function toggle() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
}
</script>

<template>
  <button
    @click="toggle"
    class="text-primary hover:opacity-70 transition-opacity cursor-pointer rounded-full border-2 size-10"
  >
    <VIcon class="size-9 p-0 m-0" :name="dark ? 'gi-sunrise' : 'gi-moon-bats'" scale="2" />
  </button>
</template>
