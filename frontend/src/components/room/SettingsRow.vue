<script setup lang="ts">
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="w-full flex items-center justify-between px-5 pt-2 pb-1 lg:py-4 rounded-xl bg-bg/50 ring-1 ring-secondary/15 hover:ring-accent/40 hover:bg-bg/80 transition-all cursor-pointer"
    @click="$emit('click')"
  >
    <div class="flex flex-col items-start">
      <span class="text-xl text-primary font-body pt-1"><slot name="label" /></span>
      <span v-if="$slots.subtitle" class="text-md text-secondary text-left"
        ><slot name="subtitle"
      /></span>
    </div>
    <slot />
  </button>
</template>
