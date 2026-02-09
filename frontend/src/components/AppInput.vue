<script setup lang="ts">
const id = `input-${Math.random().toString(36).slice(2, 9)}`

const props = defineProps<{
  type?: string
  placeholder?: string
  label?: string
  class?: string
  min?: number
  max?: number
}>()

const model = defineModel<string | number>()

function clamp(val: number): number {
  if (props.min != null && val < props.min) return props.min
  if (props.max != null && val > props.max) return props.max
  return val
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (props.type === 'number') {
    model.value = clamp(Number(val))
  } else {
    model.value = val
  }
}

function increment() {
  model.value = clamp(Number(model.value ?? 0) + 1)
}

function decrement() {
  model.value = clamp(Number(model.value ?? 0) - 1)
}
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-semibold text-secondary mb-1">
      {{ label }}
    </label>
    <div v-if="type === 'number'" class="relative">
      <input
        :id="id"
        type="number"
        :placeholder="placeholder"
        :value="modelValue"
        :class="$props.class"
        class="app-number-input font-heading w-full px-10 pt-2 pb-2 rounded-lg bg-bg border-2 border-secondary/30 outline-none text-primary transition-colors caret-primary text-center"
        @input="onInput"
      />
      <button
        type="button"
        class="absolute left-0 inset-y-0 w-10 flex items-center justify-center text-secondary hover:text-accent transition-colors cursor-pointer"
        @click="decrement"
      >
        <span class="text-xl font-bold leading-none pt-2">-</span>
      </button>
      <button
        type="button"
        class="absolute right-0 inset-y-0 w-10 flex items-center justify-center text-secondary hover:text-accent transition-colors cursor-pointer"
        @click="increment"
      >
        <span class="text-xl font-bold leading-none pt-2">+</span>
      </button>
    </div>
    <input
      v-else
      :id="id"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :value="modelValue"
      :class="$props.class"
      class="w-full px-4 pt-2 pb-2 rounded-lg bg-bg border-2 border-secondary/30 outline-none text-primary font-heading transition-colors caret-primary"
      @input="onInput"
    />
  </div>
</template>

<style scoped>
.app-number-input::-webkit-inner-spin-button,
.app-number-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.app-number-input {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
