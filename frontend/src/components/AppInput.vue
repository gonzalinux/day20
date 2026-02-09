<script setup lang="ts">
defineProps<{
  type?: string
  placeholder?: string
  modelValue?: string
  class?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :type="type ?? 'text'"
    :placeholder="placeholder"
    :value="modelValue"
    :class="$props.class"
    class="w-full px-4 pt-3 pb-1 rounded-lg bg-bg border-2 border-secondary/30 outline-none text-primary font-body transition-colors caret-transparent"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
