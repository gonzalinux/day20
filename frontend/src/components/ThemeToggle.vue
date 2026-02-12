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

defineExpose({ toggle })
</script>

<template>
  <button
    @click="toggle"
    class="text-primary hover:opacity-70 transition-opacity cursor-pointer rounded-full border-2 size-8"
  >
    <VIcon class="size-7 p-0 m-0" :name="dark ? 'gi-sunrise' : 'gi-moon-bats'" scale="1.5" />
  </button>
</template>
