<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  label?: string
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [pin: string] }>()

const digits = ref<string[]>([])

function addDigit(d: string) {
  if (digits.value.length >= 4) return
  digits.value.push(d)
  const pin = digits.value.join('')
  model.value = pin
  if (digits.value.length === 4) {
    emit('complete', pin)
  }
}

function removeDigit() {
  digits.value.pop()
  model.value = digits.value.join('')
}

function clear() {
  digits.value = []
  model.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key >= '0' && e.key <= '9') {
    addDigit(e.key)
  } else if (e.key === 'Backspace') {
    removeDigit()
  }
}

watch(model, (v) => {
  if (v === '' && digits.value.length > 0) {
    digits.value = []
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

defineExpose({ clear })
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <!-- Label -->
    <span v-if="label" class="text-sm font-semibold text-secondary">{{ label }}</span>

    <!-- Dots -->
    <div class="flex gap-3">
      <div
        v-for="i in 4"
        :key="i"
        class="size-4 rounded-full border-2 transition-all duration-150"
        :class="i <= digits.length
          ? 'bg-accent border-accent scale-110'
          : 'bg-transparent border-secondary/40'"
      />
    </div>

    <!-- Numpad -->
    <div class="grid grid-cols-3 gap-2 w-full max-w-[15rem]">
      <button
        v-for="d in ['1','2','3','4','5','6','7','8','9']"
        :key="d"
        type="button"
        class="aspect-square rounded-xl bg-bg/80 border border-secondary/20 text-primary font-heading text-xl font-bold
               hover:bg-accent/15 hover:border-accent/40 active:scale-95 transition-all cursor-pointer select-none"
        @click="addDigit(d)"
      >
        {{ d }}
      </button>

      <!-- Empty cell -->
      <div />

      <!-- 0 -->
      <button
        type="button"
        class="aspect-square rounded-xl bg-bg/80 border border-secondary/20 text-primary font-heading text-xl font-bold
               hover:bg-accent/15 hover:border-accent/40 active:scale-95 transition-all cursor-pointer select-none"
        @click="addDigit('0')"
      >
        0
      </button>

      <!-- Backspace -->
      <button
        type="button"
        class="aspect-square rounded-xl bg-bg/80 border border-secondary/20 text-secondary font-heading text-lg
               hover:bg-red-500/15 hover:border-red-400/40 active:scale-95 transition-all cursor-pointer select-none flex items-center justify-center"
        @click="removeDigit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
          <line x1="18" y1="9" x2="12" y2="15"/>
          <line x1="12" y1="9" x2="18" y2="15"/>
        </svg>
      </button>
    </div>
  </div>
</template>
