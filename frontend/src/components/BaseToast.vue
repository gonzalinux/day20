<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '@/composables/useToast'

const { visible, message, variant } = useToast()

const colorClass = computed(() => {
  switch (variant.value) {
    case 'error':
      return 'bg-red-600 text-white'
    case 'warning':
      return 'bg-yellow-600 text-white'
    default:
      return 'bg-accent text-bg'
  }
})
</script>

<template>
  <Transition name="toast">
    <div
      v-if="visible"
      class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-heading font-bold shadow-lg"
      :class="colorClass"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.2s ease;
}
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
