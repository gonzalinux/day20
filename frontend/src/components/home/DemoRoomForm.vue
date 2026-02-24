<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppInput from '@/components/AppInput.vue'
import { DEMO_ROOM_NAME, DEMO_PASSWORD } from './demoConstants'

const emit = defineEmits<{ advance: [roomName: string] }>()

const { t } = useI18n()

const roomName = ref('')
const password = ref('')
const userEditing = ref(false)
const activeField = ref<'roomName' | 'password' | null>(null)

const canAdvance = computed(() => roomName.value.length >= 3 && password.value.length >= 3)

let timers: ReturnType<typeof setTimeout>[] = []

function addTimer(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}

function stopAutoPlay() {
  timers.forEach(clearTimeout)
  timers = []
  activeField.value = null
  userEditing.value = true
}

function startAutoPlay() {
  let delay = 0
  activeField.value = 'roomName'

  for (let i = 0; i < DEMO_ROOM_NAME.length; i++) {
    const char = DEMO_ROOM_NAME[i]!
    addTimer(() => {
      if (!userEditing.value) roomName.value += char
    }, delay)
    delay += 120
  }

  delay += 400
  addTimer(() => {
    if (!userEditing.value) activeField.value = 'password'
  }, delay)

  for (let i = 0; i < DEMO_PASSWORD.length; i++) {
    const char = DEMO_PASSWORD[i]!
    addTimer(() => {
      if (!userEditing.value) password.value += char
    }, delay)
    delay += 100
  }

  delay += 1500
  addTimer(() => {
    if (!userEditing.value) emit('advance', roomName.value)
  }, delay)
}

onMounted(startAutoPlay)
onUnmounted(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="bg-bg rounded-2xl shadow-xl p-6 w-full max-w-sm mx-auto">
    <h3 class="font-heading text-primary text-xl font-bold mb-4">
      {{ t('roomLogin.createRoom') }}
    </h3>
    <div class="space-y-4">
      <AppInput
        :label="t('roomLogin.roomName')"
        v-model="roomName"
        :class="!userEditing && activeField === 'roomName' ? 'ring-2 ring-accent/60' : ''"
        @input="stopAutoPlay"
      />
      <AppInput
        type="password"
        :label="t('roomLogin.password')"
        v-model="password"
        :class="!userEditing && activeField === 'password' ? 'ring-2 ring-accent/60' : ''"
        @input="stopAutoPlay"
      />
    </div>
    <button
      v-if="userEditing && canAdvance"
      class="mt-4 w-full bg-accent text-bg font-heading font-bold py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
      @click="emit('advance', roomName)"
    >
      {{ t('roomLogin.next') }} →
    </button>
  </div>
</template>
