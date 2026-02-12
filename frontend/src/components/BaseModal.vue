<script setup lang="ts">
export interface ModalAction {
  label: string
  handler: () => void
  variant?: 'primary' | 'danger' | 'secondary'
}

defineProps<{
  title: string
  actions?: ModalAction[]
}>()

const emit = defineEmits<{ close: [] }>()

const variantClass: Record<string, string> = {
  primary: 'bg-accent text-bg',
  danger: 'bg-red-500 text-white',
  secondary: 'bg-secondary/20 text-primary hover:bg-secondary/30',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="emit('close')">
      <div class="absolute inset-0 bg-black/50" />
      <div class="relative rounded-2xl bg-bg shadow-xl p-6 w-full max-w-sm mx-4 max-h-[85vh] flex flex-col">
        <h3 class="text-xl font-heading font-bold text-accent mb-3">
          {{ title }}
        </h3>
        <div class="flex-1 min-h-0">
          <slot />
        </div>
        <div v-if="actions?.length" class="flex gap-3 mt-4 shrink-0">
          <button
            v-for="(action, i) in actions"
            :key="i"
            class="flex-1 px-4 py-3 rounded-lg font-heading font-bold transition-all cursor-pointer hover:opacity-90"
            :class="variantClass[action.variant ?? 'primary']"
            @click="action.handler"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
